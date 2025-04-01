module.exports = [
  {
    "regex": "Android dependencies have to be re\\-resolved",
    "result": "Android dependencies are not resolved.",
    "showLine": 0
  },
  {
    "regex": "Upload Failed\\:",
    "result": "Upload failed.",
    "showLine": 0
  },
  {
    "regex": "\\: error",
    "result": "Error.",
    "showLine": 3
  },
  {
    "regex": "error\\:",
    "result": "Error.",
    "showLine": 3
  },
  {
    "regex": "Task \"Exporting development IPA from xcode archive\" failed",
    "result": "ios certificate error.",
    "showLine": 0
  },
  {
    "regex": "Error Domain=DVTPortalServiceErrorDomain",
    "result": "ios upload error.",
    "showLine": 0
  },
  {
    "regex": "file must contain a higher version than that of the previously approved version",
    "result": "Cannot upload the same version to apple store.",
    "showLine": 0
  },
  {
    "regex": "Nested Prefab problem",
    "result": "Nested prefab problem.",
    "showLine": 0
  },
  {
    "regex": "UnityException\\: Creating asset at path",
    "result": "Asset creation failed.",
    "showLine": 0
  },
  {
    "regex": "Object reference not set to an instance of an object",
    "result": "null reference exception.",
    "showLine": 3
  },
  {
    "regex": "Builder Build target is not supported!",
    "result": "Build target not supported. Please check for missing unity editor module",
    "showLine": 0
  },
  {
    "regex": "Build prerequisites are not met! Halting!",
    "result": "Build prerequisites are not met!",
    "showLine": 0
  }
]
