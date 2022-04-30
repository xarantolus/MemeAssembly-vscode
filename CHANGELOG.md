# Change Log

## [0.4.3] - 2022-05-01
* Fix small bug where definitions could not be found when on Windows

## [0.4.2] - 2022-04-30
* Add definition providers for loop constructs (like `banana` and `where banana`)
  * You can now jump to the matching loop start/end using the "Go to definition" shortcut
* Add symbol provider
  * VSCode can now show the "Outline" view that displays all functions defined in a file
* Add code lense provider
  * A "Run program" button is now displayed above `main` functions, making it possible to just run that function by clicking
* Improve file resolve algorithm
  * When running MemeAssembly files that reference functions from other files, the search algorithm for these functions tries to not select duplicate function definitions
* Reduced extension size to 1/4th by bundling dependencies

## [0.4.1] - 2022-04-30
* Add a code formatter
* Display errors when the "Run current file" command fails

## [0.4.0] - 2022-04-29
* Support for multiple input files
  * When compiling, the extension will automatically find all required files for your program and add them to the compile command
* Support for "Go to Definition" and "Go to References"
  * Also works across multiple files as long as they are in your workspace

## [0.3.5] - 2022-04-20
* Added the `MemeAssembly: Insert print commands` commmand to generate code for printing long texts
* Support for the `whomst has summoned the almighty one` instruction coming in the next version

## [0.3.4] - 2022-01-26
* Fix many small syntax highlighting bugs
* Add update command: easily update to the latest MemeAssembly version
* Support for "unlimited power" command

## [0.3.1] - 2021-09-19
* Improve hover cards

## [0.2.4] - 2021-09-06
* Add the "MemeAssembly: Run current file" command. You can run it from the command palette or using the <kbd>Ctrl</kbd>+<kbd>M</kbd> keyboard shortcut
