// inputAdjustment.js
export function getAdjustedInputs(userInputs) {
  const adjusted = {};
  for (const key in userInputs) {
    if (key === "Muscle" || key === "Body Fat") {
      adjusted[key] = userInputs[key] / 100;
    } else {
      adjusted[key] = userInputs[key];
    }
  }
  // Calculate Cup from Bust and Underbust and add it.
  // (Cup = Bust - Underbust)
  if ("Bust" in userInputs && "Underbust" in userInputs) {
    adjusted["Cup"] = userInputs["Bust"] - userInputs["Underbust"];
  }
  return adjusted;
}
