// counts emoji as a single char
function realLength(str) {
  const joiner = "\u{200D}";
  const split = str.split(joiner);
  let count = 0;

  for (const s of split) {
    const num = Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
    count += num;
  }

  return count / split.length;
}

function formatText(text, maxLength, char = " ", align = "left") {
  const truncatedString = text.substring(0, maxLength);
  if (realLength(truncatedString) < maxLength) {
    if (align == "left") {
      return truncatedString + char.repeat(maxLength - realLength(truncatedString));
    } else {
      return char.repeat(maxLength - realLength(truncatedString)) + truncatedString;
    }
  } else {
    return truncatedString;
  }
}

module.exports = {
  realLength,
  formatText
};
