export const ModifyString = (stringVal, stringCase, splitSign) => {
  // Handle undefined or null values
  if (!stringVal) {
    return "";
  }

  let splittedString = splitSign ? stringVal.split(splitSign ?? "_") : [];
  let modifiedString = "";

  splittedString.length > 0 &&
    splittedString?.forEach((elem) => {
      modifiedString += elem?.charAt(0).toUpperCase() + elem?.slice(1) + " ";
    });
  if (stringCase == "upper") {
    return modifiedString ? modifiedString?.toUpperCase() : "";
  } else if (stringCase == "lower") {
    return modifiedString ? modifiedString?.toLowerCase() : "";
  } else return modifiedString?.trim();
};
