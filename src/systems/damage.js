let lastHitCrit = false;

// Function to calculate total damage with random chance for critical hit
export function calculateDamage(dmg, critdmg, critrate) {
  // critrate is 0.2 (20%), so we multiply by 100 to compare with random 1-100
  let chance = Math.floor(Math.random() * 100) + 1;
  const isCriticalHit = chance <= (critrate * 100);
  lastHitCrit = isCriticalHit;

  if (isCriticalHit) {
    console.log("CRITICAL HIT!");
    return Math.floor(dmg * critdmg);
  } else {
    return Math.floor(dmg);
  }
}

export function isLastHitCritical() {
  return lastHitCrit;
}
