export default [
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
    "result": "Compilation error.",
    "showLine": 5
  },
  {
    "regex": "Task \"Exporting development IPA from xcode archive\" failed",
    "result": "ios certificate error.",
    "showLine": 0
  },
  {
    "regex": "file must contain a higher version than that of the previously approved version",
    "result": "Cannot upload the same version to apple store.",
    "showLine": 0
  }
]
