# Change Log

## [0.5.0] - 2023-06-11
* Initial support for new commands from v1.6.0

## [0.4.9] - 2022-06-06
* Add "Debug program" button above main functions

## [0.4.8] - 2022-06-06
* Add rename provider for registers

## [0.4.7] - 2022-06-06
* Fix installation script in WSL

## [0.4.6] - 2022-06-06
* The install script now shows errors in case they happened (instead of closing the terminal instantly)
* Support running files that are not in the workspace
* Detect input reading across files (instead of only the main file); this is used to set the terminal focus (only if input is read)
* Support for new MemeAssembly commands
* Update dependencies

## [0.4.5] - 2022-05-14
* You no longer need to save files before definitions will become available. The extension will use already opened files if possible and fall back to the file on disk
* Add "Go to definition" for "corporate needs you to find the difference between ..." and matching "they're the same picture" commands
* Folding provider for functions, including ones with multiple return statements
* Formatter now works with functions that have multiple return statements
* Remove some unnecessary operations when matching lines

## [0.4.4] - 2022-05-01
* Add cross-file function renaming: just use "Rename symbol" to rename a function

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
