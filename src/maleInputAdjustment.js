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
  // Calculate Cup from Chest and Rib and add it.
  // (Cup = Chest - Rib)
  if ("Chest" in userInputs && "Rib" in userInputs) {
    adjusted["Cup"] = userInputs["Chest"] - userInputs["Rib"];
    adjusted["Bust"] = userInputs["Chest"];
  }
  return adjusted;
}
