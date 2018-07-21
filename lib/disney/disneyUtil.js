const regexTidyID = /^([^;]+)/;

function CleanID(id) {
  const capture = regexTidyID.exec(id);
  if (capture && capture.length > 1) {
    return capture[1];
  }
  return id;
}

const regexExtractIDAndType = /^([^;]+);entityType=([^;:]+)/;

function ExtractIDAndType(id) {
  const capture = regexExtractIDAndType.exec(id);
  if (capture) {
    return {
      id: Number(capture[1]),
      type: capture[2],
    };
  }
  return null;
}

module.exports = {
  CleanID,
  ExtractIDAndType,
};
