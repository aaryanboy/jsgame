// damageCalculation.js

// Function to calculate total damage with random chance for critical hit
export function calculateDamage(dmg, critdmg, critrate) {
  let chance = Math.floor(Math.random() * 101);
  const isCriticalHit = chance < critrate;

  // Calculate damage based on whether it's a critical hit or not
  if (isCriticalHit) {
    const critDamage = dmg * critdmg;

    return critDamage;
  } else {
    return dmg;
  }
}
