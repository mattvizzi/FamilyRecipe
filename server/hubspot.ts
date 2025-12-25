// HubSpot Integration Service
// Connected via Replit HubSpot connection

import { Client } from '@hubspot/api-client';
import type { User } from '@shared/models/auth';
import type { Family, Recipe } from '@shared/schema';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=hubspot',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('HubSpot not connected');
  }
  return accessToken;
}

async function getHubSpotClient() {
  const accessToken = await getAccessToken();
  return new Client({ accessToken });
}

// Pipeline and stage configuration
const FAMILY_RECIPE_PIPELINE = 'FamilyRecipe';

// Store pipeline ID after first lookup
let pipelineId: string | null = null;
let publicStageId: string | null = null;
let privateStageId: string | null = null;

async function ensurePipelineExists(): Promise<void> {
  if (pipelineId && publicStageId && privateStageId) return;
  
  const client = await getHubSpotClient();
  
  try {
    // Try to find existing pipeline
    const pipelines = await client.crm.pipelines.pipelinesApi.getAll('deals');
    const existing = pipelines.results.find(p => p.label === FAMILY_RECIPE_PIPELINE);
    
    if (existing) {
      pipelineId = existing.id;
      const publicStage = existing.stages.find(s => s.label === 'Public');
      const privateStage = existing.stages.find(s => s.label === 'Private');
      publicStageId = publicStage?.id || null;
      privateStageId = privateStage?.id || null;
      
      if (!publicStageId || !privateStageId) {
        console.warn('FamilyRecipe pipeline exists but missing Public/Private stages');
      }
      return;
    }
    
    // Create new pipeline with Public and Private stages
    const newPipeline = await client.crm.pipelines.pipelinesApi.create('deals', {
      label: FAMILY_RECIPE_PIPELINE,
      displayOrder: 0,
      stages: [
        { label: 'Private', displayOrder: 0, metadata: { probability: '0.0' } },
        { label: 'Public', displayOrder: 1, metadata: { probability: '1.0' } }
      ]
    });
    
    pipelineId = newPipeline.id;
    const publicStage = newPipeline.stages.find(s => s.label === 'Public');
    const privateStage = newPipeline.stages.find(s => s.label === 'Private');
    publicStageId = publicStage?.id || null;
    privateStageId = privateStage?.id || null;
    
    console.log('Created FamilyRecipe pipeline in HubSpot');
  } catch (error) {
    console.error('Error ensuring pipeline exists:', error);
    throw error;
  }
}

// ============ CONTACTS (Users) ============

export async function syncUserToHubSpot(user: User): Promise<string | null> {
  if (!user.email) {
    console.log('Skipping HubSpot sync for user without email');
    return null;
  }
  
  try {
    const client = await getHubSpotClient();
    
    const properties: Record<string, string> = {
      email: user.email,
    };
    
    if (user.firstName) properties.firstname = user.firstName;
    if (user.lastName) properties.lastname = user.lastName;
    
    // Try to find existing contact by email
    try {
      const existingContacts = await client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: user.email
          }]
        }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1
      });
      
      if (existingContacts.results.length > 0) {
        // Update existing contact
        const contactId = existingContacts.results[0].id;
        await client.crm.contacts.basicApi.update(contactId, { properties });
        console.log(`Updated HubSpot contact: ${user.email}`);
        return contactId;
      }
    } catch (searchError) {
      // Contact doesn't exist, continue to create
    }
    
    // Create new contact
    const response = await client.crm.contacts.basicApi.create({ properties });
    console.log(`Created HubSpot contact: ${user.email}`);
    return response.id;
  } catch (error) {
    console.error('Error syncing user to HubSpot:', error);
    return null;
  }
}

// ============ COMPANIES (Families) ============

export async function syncFamilyToHubSpot(family: Family): Promise<string | null> {
  try {
    const client = await getHubSpotClient();
    
    const properties: Record<string, string> = {
      name: family.name,
      description: `Family ID: ${family.id}`,
    };
    
    // Search for existing company by name and description (which contains our ID)
    try {
      const existingCompanies = await client.crm.companies.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'description',
            operator: 'CONTAINS_TOKEN',
            value: family.id
          }]
        }],
        properties: ['name', 'description'],
        limit: 1
      });
      
      if (existingCompanies.results.length > 0) {
        // Update existing company
        const companyId = existingCompanies.results[0].id;
        await client.crm.companies.basicApi.update(companyId, { properties });
        console.log(`Updated HubSpot company: ${family.name}`);
        return companyId;
      }
    } catch (searchError) {
      // Company doesn't exist, continue to create
    }
    
    // Create new company
    const response = await client.crm.companies.basicApi.create({ properties });
    console.log(`Created HubSpot company: ${family.name}`);
    return response.id;
  } catch (error) {
    console.error('Error syncing family to HubSpot:', error);
    return null;
  }
}

// ============ DEALS (Recipes) ============

export async function syncRecipeToHubSpot(recipe: Recipe, familyName: string): Promise<string | null> {
  try {
    await ensurePipelineExists();
    
    if (!pipelineId || !publicStageId || !privateStageId) {
      console.error('Pipeline not properly configured');
      return null;
    }
    
    const client = await getHubSpotClient();
    const stageId = recipe.isPublic ? publicStageId : privateStageId;
    
    const properties: Record<string, string> = {
      dealname: recipe.name,
      pipeline: pipelineId,
      dealstage: stageId,
      description: `Recipe ID: ${recipe.id} | Family: ${familyName} | Category: ${recipe.category}`,
    };
    
    // Search for existing deal by description (which contains our ID)
    try {
      const existingDeals = await client.crm.deals.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'description',
            operator: 'CONTAINS_TOKEN',
            value: recipe.id
          }]
        }],
        properties: ['dealname', 'dealstage', 'description'],
        limit: 1
      });
      
      if (existingDeals.results.length > 0) {
        // Update existing deal
        const dealId = existingDeals.results[0].id;
        await client.crm.deals.basicApi.update(dealId, { properties });
        console.log(`Updated HubSpot deal: ${recipe.name} (${recipe.isPublic ? 'Public' : 'Private'})`);
        return dealId;
      }
    } catch (searchError) {
      // Deal doesn't exist, continue to create
    }
    
    // Create new deal
    const response = await client.crm.deals.basicApi.create({ properties });
    console.log(`Created HubSpot deal: ${recipe.name} (${recipe.isPublic ? 'Public' : 'Private'})`);
    return response.id;
  } catch (error) {
    console.error('Error syncing recipe to HubSpot:', error);
    return null;
  }
}

// ============ ASSOCIATIONS ============

export async function associateContactWithCompany(contactId: string, companyId: string): Promise<boolean> {
  try {
    const client = await getHubSpotClient();
    
    await client.crm.associations.v4.basicApi.create(
      'contacts',
      contactId,
      'companies',
      companyId,
      [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }]
    );
    
    console.log(`Associated contact ${contactId} with company ${companyId}`);
    return true;
  } catch (error) {
    console.error('Error creating association:', error);
    return false;
  }
}

export async function associateDealWithCompany(dealId: string, companyId: string): Promise<boolean> {
  try {
    const client = await getHubSpotClient();
    
    await client.crm.associations.v4.basicApi.create(
      'deals',
      dealId,
      'companies',
      companyId,
      [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 5 }]
    );
    
    console.log(`Associated deal ${dealId} with company ${companyId}`);
    return true;
  } catch (error) {
    console.error('Error creating deal-company association:', error);
    return false;
  }
}

// ============ EMAIL TRIGGERS ============

export async function triggerEmailViaPropertyUpdate(
  email: string, 
  triggerProperty: string, 
  triggerValue: string = 'true'
): Promise<boolean> {
  try {
    const client = await getHubSpotClient();
    
    // Find contact by email
    const contacts = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      }],
      properties: ['email'],
      limit: 1
    });
    
    if (contacts.results.length === 0) {
      console.log(`No contact found for email: ${email}`);
      return false;
    }
    
    const contactId = contacts.results[0].id;
    
    // Update the trigger property (this should trigger a HubSpot workflow)
    await client.crm.contacts.basicApi.update(contactId, {
      properties: { [triggerProperty]: triggerValue }
    });
    
    console.log(`Triggered email for ${email} via property ${triggerProperty}`);
    return true;
  } catch (error) {
    console.error('Error triggering email:', error);
    return false;
  }
}

// ============ HELPER FUNCTIONS ============

export async function getHubSpotContactByEmail(email: string): Promise<string | null> {
  try {
    const client = await getHubSpotClient();
    
    const contacts = await client.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: email
        }]
      }],
      properties: ['email'],
      limit: 1
    });
    
    return contacts.results.length > 0 ? contacts.results[0].id : null;
  } catch (error) {
    console.error('Error finding contact:', error);
    return null;
  }
}

export async function getHubSpotCompanyByFamilyId(familyId: string): Promise<string | null> {
  try {
    const client = await getHubSpotClient();
    
    const companies = await client.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'description',
          operator: 'CONTAINS_TOKEN',
          value: familyId
        }]
      }],
      properties: ['name', 'description'],
      limit: 1
    });
    
    return companies.results.length > 0 ? companies.results[0].id : null;
  } catch (error) {
    console.error('Error finding company:', error);
    return null;
  }
}
