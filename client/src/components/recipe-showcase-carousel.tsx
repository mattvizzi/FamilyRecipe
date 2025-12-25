import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

import carbonara from "@assets/generated_images/spaghetti_carbonara_dish.png";
import tacos from "@assets/generated_images/beef_tacos_platter.png";
import tikka from "@assets/generated_images/chicken_tikka_masala.png";
import pizza from "@assets/generated_images/margherita_pizza_fresh.png";
import salmon from "@assets/generated_images/grilled_salmon_fillet.png";
import padThai from "@assets/generated_images/thai_pad_thai_noodles.png";
import onionSoup from "@assets/generated_images/french_onion_soup.png";
import lavaCake from "@assets/generated_images/chocolate_lava_cake.png";
import caesar from "@assets/generated_images/caesar_salad_fresh.png";
import butterChicken from "@assets/generated_images/butter_chicken_curry.png";
import bourguignon from "@assets/generated_images/beef_bourguignon_stew.png";
import scampi from "@assets/generated_images/shrimp_scampi_pasta.png";
import pancakes from "@assets/generated_images/banana_pancake_stack.png";
import moussaka from "@assets/generated_images/greek_moussaka_casserole.png";
import tomYum from "@assets/generated_images/tom_yum_shrimp_soup.png";
import pulledPork from "@assets/generated_images/bbq_pulled_pork_sandwich.png";
import eggsBenedict from "@assets/generated_images/eggs_benedict_brunch.png";
import risotto from "@assets/generated_images/mushroom_risotto_dish.png";
import fishChips from "@assets/generated_images/fish_and_chips_basket.png";
import tiramisu from "@assets/generated_images/italian_tiramisu_dessert.png";
import bibimbap from "@assets/generated_images/korean_bibimbap_bowl.png";
import gyros from "@assets/generated_images/greek_lamb_gyros.png";
import applePie from "@assets/generated_images/homemade_apple_pie.png";
import ramen from "@assets/generated_images/japanese_tonkotsu_ramen.png";
import bruschetta from "@assets/generated_images/caprese_bruschetta_appetizer.png";

const recipes = [
  { title: "Spaghetti Carbonara", image: carbonara, category: "Dinner" },
  { title: "Beef Tacos", image: tacos, category: "Dinner" },
  { title: "Chicken Tikka Masala", image: tikka, category: "Dinner" },
  { title: "Margherita Pizza", image: pizza, category: "Dinner" },
  { title: "Grilled Salmon", image: salmon, category: "Dinner" },
  { title: "Pad Thai", image: padThai, category: "Dinner" },
  { title: "French Onion Soup", image: onionSoup, category: "Appetizer" },
  { title: "Chocolate Lava Cake", image: lavaCake, category: "Dessert" },
  { title: "Caesar Salad", image: caesar, category: "Lunch" },
  { title: "Butter Chicken", image: butterChicken, category: "Dinner" },
  { title: "Beef Bourguignon", image: bourguignon, category: "Dinner" },
  { title: "Shrimp Scampi", image: scampi, category: "Dinner" },
  { title: "Banana Pancakes", image: pancakes, category: "Breakfast" },
  { title: "Greek Moussaka", image: moussaka, category: "Dinner" },
  { title: "Tom Yum Soup", image: tomYum, category: "Appetizer" },
  { title: "BBQ Pulled Pork", image: pulledPork, category: "Lunch" },
  { title: "Eggs Benedict", image: eggsBenedict, category: "Breakfast" },
  { title: "Mushroom Risotto", image: risotto, category: "Dinner" },
  { title: "Fish and Chips", image: fishChips, category: "Dinner" },
  { title: "Tiramisu", image: tiramisu, category: "Dessert" },
  { title: "Korean Bibimbap", image: bibimbap, category: "Dinner" },
  { title: "Lamb Gyros", image: gyros, category: "Lunch" },
  { title: "Apple Pie", image: applePie, category: "Dessert" },
  { title: "Tonkotsu Ramen", image: ramen, category: "Dinner" },
  { title: "Caprese Bruschetta", image: bruschetta, category: "Appetizer" },
];

export function RecipeShowcaseCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const scroll = () => {
      scrollPosition += speed;
      
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    const handleMouseEnter = () => {
      cancelAnimationFrame(animationId);
    };

    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(scroll);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const doubledRecipes = [...recipes, ...recipes];

  return (
    <section className="py-12 overflow-hidden">
      <div className="text-center mb-8 px-6">
        <p className="text-sm font-medium text-primary mb-2">RECIPE COLLECTION</p>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Beautiful recipes, beautifully organized
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          See how your family recipes will look in the app
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-hidden px-4"
        style={{ scrollBehavior: "auto" }}
      >
        {doubledRecipes.map((recipe, index) => (
          <Card 
            key={`${recipe.title}-${index}`}
            className="flex-shrink-0 w-64 overflow-hidden border border-border"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img 
                src={recipe.image} 
                alt={recipe.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{recipe.category}</p>
              <h3 className="font-semibold text-sm truncate">{recipe.title}</h3>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
