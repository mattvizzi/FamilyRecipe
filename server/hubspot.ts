// HubSpot Integration Service
// Uses custom HUBSPOT_ACCESS_TOKEN from private app

import { Client } from '@hubspot/api-client';
import type { User } from '@shared/models/auth';
import type { Family, Recipe } from '@shared/schema';

function getAccessToken(): string {
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('HUBSPOT_ACCESS_TOKEN not configured. Please add your HubSpot private app access token.');
  }
  return accessToken;
}

function getHubSpotClient() {
  const accessToken = getAccessToken();
  return new Client({ accessToken });
}

// FamilyRecipe Pipeline configuration (pre-configured in HubSpot)
const PIPELINE_ID = '845703566';
const STAGE_PRIVATE = '1258285422';
const STAGE_PUBLIC = '1258285423';

function getPipelineStage(isPublic: boolean): { pipelineId: string; stageId: string } {
  return {
    pipelineId: PIPELINE_ID,
    stageId: isPublic ? STAGE_PUBLIC : STAGE_PRIVATE
  };
}

// ============ CONTACTS (Users) ============

export async function syncUserToHubSpot(user: User): Promise<string | null> {
  if (!user.email) {
    console.log('Skipping HubSpot sync for user without email');
    return null;
  }
  
  try {
    const client = getHubSpotClient();
    
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
    const client = getHubSpotClient();
    
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
    const { pipelineId, stageId } = getPipelineStage(recipe.isPublic);
    
    const client = getHubSpotClient();
    
    const properties: Record<string, string> = {
      dealname: recipe.name,
      pipeline: pipelineId,
      dealstage: stageId,
      description: `Recipe ID: ${recipe.id} | Family: ${familyName} | Category: ${recipe.category} | ${recipe.isPublic ? 'Public' : 'Private'}`,
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
    const client = getHubSpotClient();
    
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
    const client = getHubSpotClient();
    
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
    const client = getHubSpotClient();
    
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
    const client = getHubSpotClient();
    
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
    const client = getHubSpotClient();
    
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
