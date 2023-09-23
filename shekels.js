function normalizeShekelString(string) {
    // a few transformations that make strings match despite some unimportant variations:
    // שנים עשר שקלים
    // שתים עשרה שקל
    // שניים-עשר שקלים חדשים
    return (
      string
        .replace(/[^א-ת ]/g, "")
        .replace(/(שקל חדש|שקלים חדשים|שקלים|שקל|שח|ש"ח|אגורה|אגורות)/g, "")
        .replace(/ חדשים| חדש/g, "")
        // male to female
        .replace(/ה /g, " ")
        .replace(/יי/g, "י")
        .replace(/שתי/g, "שני")
        .replace(/אחת/g, "אחד")
        .replace(/חמש/g, "חמיש")
        .replace(/שש/g, "שיש")
        .replace(/מליון/g, "מיליון")
        .replace(/מליארד|מילירד/g, "מיליארד")
        .replace(/ו/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
}

function amountToNumString(amount) {
  if (!amount) {
    return "";
  }
  let num = +amount;
  let numString = num.toString();
  if (!numString.match(/^\d{1,12}(\.\d{1,2})?$/)) {
    return null;
  }
  return numString;
}

function amountToShekelsInHebrew(amount) {
  let numString = amountToNumString(amount);
  if (numString === "") {
    return "";
  }
  if (numString === null) {
    return "לא הוקש סכום תקין";
  }
  let components = numString.split(".");
  let integer = shekelsToHebrew(+components[0]);
  let cents = "";
  if (components.length > 1) {
    let centsString = components[1];
    if (centsString.length == 1) {
      centsString += "0";
    }
    cents = centsToHebrew(+centsString);
  }
  return hebrewJoin([integer, cents]);
}

function hebrewJoin(components) {
  components = components.filter((x) => x);
  if (components.length < 2) {
    return components.join(" ");
  }
  let last = components.pop();
  return `${components.join(" ")} ו${last}`;
}

function hebrewConcat(a, b, c) {
  if (!b) return a;
  if (!a) return b;
  return `${a} ${b}`;
}

function shekelIntegerToHebrew(amount) {
  amount = amount.toString();
  let componentNames = ["", "אלף", "מיליון", "מיליארד"];
  let intComponents = [];
  let i = amount.length;
  while (i > 0) {
    i -= 3;
    let component = +amount.substring(i, i + 3);
    intComponents.push(component);
  }

  let hebrewComponents = intComponents
    .flatMap((c, i) => componentToHebrewComponents(c, componentNames[i]))
    .reverse();
  let result = hebrewJoin(hebrewComponents);
  return hebrewConcat(result, "שקלים");
}

function componentToHebrewComponents(value, componentName) {
  if (typeof value !== "number" || value < 0 || value > 999) {
    throw new Error(`Logical error: {component} is not a 3 digit number`);
  }
  if (value === 0) {
    return [];
  }
  let units = {
    1: "אחד",
    2: "שניים",
    3: "שלושה",
    4: "ארבעה",
    5: "חמישה",
    6: "שישה",
    7: "שבעה",
    8: "שמונה",
    9: "תשעה",
  };
  let teens = {
    11: "אחד עשר",
    12: "שנים עשר",
    13: "שלושה עשר",
    14: "ארבעה עשר",
    15: "חמישה עשר",
    16: "שישה עשר",
    17: "שבעה עשר",
    18: "שמונה עשר",
    19: "תשעה עשר",
  };
  let tens = {
    1: "עשרה",
    2: "עשרים",
    3: "שלושים",
    4: "ארבעים",
    5: "חמישים",
    6: "שישים",
    7: "שבעים",
    8: "שמונים",
    9: "תשעים",
  };
  let hundreds = {
    1: "מאה",
    2: "מאתיים",
    3: "שלוש מאות",
    4: "ארבע מאות",
    5: "חמש מאות",
    6: "שש מאות",
    7: "שבע מאות",
    8: "שמונה מאות",
    9: "תשע מאות",
  };
  let thousands = {
    1: "אלף",
    2: "אלפיים",
    3: "שלושת אלפים",
    4: "ארבעת אלפים",
    5: "חמשת אלפים",
    6: "ששת אלפים",
    7: "שבעת אלפים",
    8: "שמונת אלפים",
    9: "תשעת אלפים",
    10: "עשרת אלפים",
  };
  let hebrewComponents = [];
  if (componentName === "אלף" && value in thousands) {
    componentName = thousands[value];
  } else if (value === 1 && componentName) {
  } else if (value === 2) {
    hebrewComponents.push("שני");
  } else if (value in teens) {
    hebrewComponents.push(teens[value]);
  } else {
    let u = value % 10;
    let t = Math.floor((value % 100) / 10);
    let h = Math.floor(value / 100);
    if (10 * t + u in teens) {
      hebrewComponents.push(teens[10 * t + u]);
    } else {
      hebrewComponents.push(units[u]);
      hebrewComponents.push(tens[t]);
    }
    if (h) {
      hebrewComponents.push(hundreds[h]);
    }
  }

  if (componentName) {
    // "אלפיים" or "מאתיים ואחד אלף" are each treated as a single component of the main join
    // e.g. שני מיליון ומאתיים ואחד אלף
    // e.g. שני מיליון ואלף
    // e.g. שני מיליון אלף ואחד
    let hebrew = hebrewJoin(hebrewComponents.reverse());
    return [hebrewConcat(hebrew, componentName)];
  }
  // "twenty two" are two components, e.g. מאתיים אלף עשרים ושתיים but מאתיים אלף ועשרים
  return hebrewComponents;
}

function shekelsToHebrew(amount) {
  if (amount) {
    if (amount === 1) {
      return "שקל אחד";
    } else {
      return shekelIntegerToHebrew(amount);
    }
  }
  return "";
}
function centsToHebrew(value) {
  if (!value) {
    return "";
  }
  if (value === 1) {
    return "אגורה";
  }
  let units = {
    1: "אחת",
    2: "שתיים",
    3: "שלוש",
    4: "ארבע",
    5: "חמש",
    6: "שש",
    7: "שבע",
    8: "שמונה",
    9: "תשע",
  };
  let teens = {
    11: "אחת עשרה",
    12: "שתים עשרה",
    13: "שלוש עשרה",
    14: "ארבע עשרה",
    15: "חמש עשרה",
    16: "שש עשרה",
    17: "שבע עשרה",
    18: "שמונה עשרה",
    19: "תשע עשרה",
  };
  let tens = {
    1: "עשר",
    2: "עשרים",
    3: "שלושים",
    4: "ארבעים",
    5: "חמישים",
    6: "שישים",
    7: "שבעים",
    8: "שמונים",
    9: "תשעים",
  };

  let u = value % 10;
  let t = Math.floor(value / 10);

  let hebrewComponents = [];
  if (value === 2) {
    hebrewComponents.push("שתי");
  } else if (value in teens) {
    hebrewComponents.push(teens[value]);
  } else {
    if (10 * t + u in teens) {
      hebrewComponents.push(teens[10 * t + u]);
    } else {
      hebrewComponents.push(units[u]);
      hebrewComponents.push(tens[t]);
    }
  }

  let hebrew = hebrewJoin(hebrewComponents.reverse());
  return hebrewConcat(hebrew, "אגורות");
}

function test(amount, expected) {
  let actual = amountToShekelsInHebrew(amount);
  if (actual !== expected) {
    console.log(`Failed test:\n${actual} !=\n${expected}\n`);
    //console.log(`test(${amount}, "${actual}")`);
  }
}
function normalizeTest(a, b) {
  let normalizedA = normalizeShekelString(a);
  let normalizedB = normalizeShekelString(b);
  if (normalizedA !== normalizedB) {
    console.log(`Failed test:\n${a} => ${normalizedA} != ${normalizedB} <= ${b}`);
  }
}
function tests() {
  test(1, "שקל אחד");
  test(2, "שני שקלים");
  test(10, "עשרה שקלים");
  test(13, "שלושה עשר שקלים");
  test(19, "תשעה עשר שקלים");
  test(20, "עשרים שקלים");
  test(90, "תשעים שקלים");
  test(100, "מאה שקלים");
  test(200, "מאתיים שקלים");
  test(300, "שלוש מאות שקלים");
  test(110, "מאה ועשרה שקלים");
  test(111, "מאה ואחד עשר שקלים");
  test(120, "מאה ועשרים שקלים");
  test(999, "תשע מאות תשעים ותשעה שקלים");
  test(1000, "אלף שקלים");
  test(1001, "אלף ואחד שקלים");
  test(9999, "תשעת אלפים תשע מאות תשעים ותשעה שקלים");
  test(10000, "עשרת אלפים שקלים");
  test(11000, "אחד עשר אלף שקלים");
  test(11005, "אחד עשר אלף וחמישה שקלים");
  test(99999, "תשעים ותשעה אלף תשע מאות תשעים ותשעה שקלים");
  test(999999, "תשע מאות תשעים ותשעה אלף תשע מאות תשעים ותשעה שקלים");
  test(
    9999999,
    "תשעה מיליון תשע מאות תשעים ותשעה אלף תשע מאות תשעים ותשעה שקלים"
  );
  test(9900000, "תשעה מיליון ותשע מאות אלף שקלים");
  test(10000000, "עשרה מיליון שקלים");
  test(100000000, "מאה מיליון שקלים");
  test(1000000000, "מיליארד שקלים");
  test(10000000000, "עשרה מיליארד שקלים");
  test(100000000000, "מאה מיליארד שקלים");
  test(900000000001, "תשע מאות מיליארד ואחד שקלים");
  test(900000000011, "תשע מאות מיליארד ואחד עשר שקלים");
  test(901000000001, "תשע מאות ואחד מיליארד ואחד שקלים");
  test(17000000001, "שבעה עשר מיליארד ואחד שקלים");
  test(
    9876543210,
    "תשעה מיליארד שמונה מאות שבעים ושישה מיליון חמש מאות ארבעים ושלושה אלף מאתיים ועשרה שקלים"
  );
  test(
    9070503010,
    "תשעה מיליארד שבעים מיליון חמש מאות ושלושה אלף ועשרה שקלים"
  );
  test(9006003001, "תשעה מיליארד שישה מיליון שלושת אלפים ואחד שקלים");
  test(9006003000, "תשעה מיליארד שישה מיליון ושלושת אלפים שקלים");
  test(
    2222222222,
    "שני מיליארד מאתיים עשרים ושניים מיליון מאתיים עשרים ושניים אלף מאתיים עשרים ושניים שקלים"
  );
  test(
    22222222222,
    "עשרים ושניים מיליארד מאתיים עשרים ושניים מיליון מאתיים עשרים ושניים אלף מאתיים עשרים ושניים שקלים"
  );
  test(
    20202020202,
    "עשרים מיליארד מאתיים ושניים מיליון עשרים אלף מאתיים ושניים שקלים"
  );
  test(
    2200220022,
    "שני מיליארד מאתיים מיליון מאתיים ועשרים אלף עשרים ושניים שקלים"
  );
  test(1.23, "שקל אחד ועשרים ושלוש אגורות");
  test(1.2, "שקל אחד ועשרים אגורות");
  test(1.02, "שקל אחד ושתי אגורות");
  test(0.02, "שתי אגורות");
  test(0.01, "אגורה");
  test(0.1, "עשר אגורות");
  test(0.11, "אחת עשרה אגורות");
  test(0.19, "תשע עשרה אגורות");
  test(0.2, "עשרים אגורות");
  test(100.02, "מאה שקלים ושתי אגורות");
  test(null, "");
  test("א", "לא הוקש סכום תקין");
  test(1222333444555, "לא הוקש סכום תקין");

  test(200356, "מאתיים אלף שלוש מאות חמישים ושישה שקלים");
  test(201356, "מאתיים ואחד אלף שלוש מאות חמישים ושישה שקלים");
  test(200300, "מאתיים אלף ושלוש מאות שקלים");
  test(200000, "מאתיים אלף שקלים");
  test(200030, "מאתיים אלף ושלושים שקלים");
  test(200032, "מאתיים אלף שלושים ושניים שקלים");
  test(230000, "מאתיים ושלושים אלף שקלים");
  test(230030, "מאתיים ושלושים אלף ושלושים שקלים");
  test(230032, "מאתיים ושלושים אלף שלושים ושניים שקלים");

  // up to three components, autogenerated
  test(1001100, "מיליון אלף ומאה שקלים");
  test(1010001, "מיליון עשרת אלפים ואחד שקלים");
  test(1010010, "מיליון עשרת אלפים ועשרה שקלים");
  test(1010100, "מיליון עשרת אלפים ומאה שקלים");
  test(1011000, "מיליון ואחד עשר אלף שקלים");
  test(1100001, "מיליון מאה אלף ואחד שקלים");
  test(1100010, "מיליון מאה אלף ועשרה שקלים");
  test(1100100, "מיליון מאה אלף ומאה שקלים");
  test(1101000, "מיליון ומאה ואחד אלף שקלים");
  test(1110000, "מיליון ומאה ועשרה אלף שקלים");

  // all powers of 11, autogenerated
  test(1, "שקל אחד");
  test(11, "אחד עשר שקלים");
  test(121, "מאה עשרים ואחד שקלים");
  test(1331, "אלף שלוש מאות שלושים ואחד שקלים");
  test(14641, "ארבעה עשר אלף שש מאות ארבעים ואחד שקלים");
  test(161051, "מאה שישים ואחד אלף חמישים ואחד שקלים");
  test(
    1771561,
    "מיליון שבע מאות שבעים ואחד אלף חמש מאות שישים ואחד שקלים"
  );
  test(
    19487171,
    "תשעה עשר מיליון ארבע מאות שמונים ושבעה אלף מאה שבעים ואחד שקלים"
  );
  test(
    214358881,
    "מאתיים וארבעה עשר מיליון שלוש מאות חמישים ושמונה אלף שמונה מאות שמונים ואחד שקלים"
  );
  test(
    2357947691,
    "שני מיליארד שלוש מאות חמישים ושבעה מיליון תשע מאות ארבעים ושבעה אלף שש מאות תשעים ואחד שקלים"
  );
  test(
    25937424601,
    "עשרים וחמישה מיליארד תשע מאות שלושים ושבעה מיליון ארבע מאות עשרים וארבעה אלף שש מאות ואחד שקלים"
  );
  test(
    285311670611,
    "מאתיים שמונים וחמישה מיליארד שלוש מאות ואחד עשר מיליון שש מאות ושבעים אלף שש מאות ואחד עשר שקלים"
  );
  // all powers of 102, autogenerated
  test(102, "מאה ושניים שקלים");
  test(10404, "עשרת אלפים ארבע מאות וארבעה שקלים");
  test(1061208, "מיליון שישים ואחד אלף מאתיים ושמונה שקלים");
  test(
    108243216,
    "מאה ושמונה מיליון מאתיים ארבעים ושלושה אלף מאתיים ושישה עשר שקלים"
  );
  test(
    11040808032,
    "אחד עשר מיליארד ארבעים מיליון שמונה מאות ושמונה אלף שלושים ושניים שקלים"
  );
  // all powers of 2003, autogenerated
  test(2003, "אלפיים ושלושה שקלים");
  test(4012009, "ארבעה מיליון שנים עשר אלף ותשעה שקלים");
  test(
    8036054027,
    "שמונה מיליארד שלושים ושישה מיליון חמישים וארבעה אלף עשרים ושבעה שקלים"
  );
  for (let i = 1; i < 1e12; i *= 102) {
    // test(i, i);
  }

  normalizeTest("שתים עשרה שקל ושמונים אגורות", "שניים עשר שמונים");
  normalizeTest("חמש מאות אלף, מאה ושלושים שקלים חדשים", "חמש מאות אלף מאה שלושים");
  normalizeTest("שמונה מיליארד שלושים ושישה מיליון חמישים וארבעה אלף עשרים ושבעה שקלים", "שמונה מיליארד ושלושים וששה מליון וחמישים וארבע אלף ועשרים ושבע שקל");
}
//tests();
