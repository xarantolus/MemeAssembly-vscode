# MemeAssembly Extension for Visual Studio Code
This [extension](https://marketplace.visualstudio.com/items?itemName=xarantolus.memeassembly) provides snippets and syntax highlighting for [MemeAssembly](https://github.com/kammt/MemeAssembly), a highly advanced x86-Assembly based programming language that uses only memes as commands.

### Features
* Syntax highlighting
  * also marks/highlights invalid usages of commands
* Easily run the current MemeAssembly file using the <kbd>Ctrl</kbd>+<kbd>M</kbd> keyboard shortcut
  * You can also open a `.memeasm` file, switch to the command palette and execute the `MemeAssembly: Run current file` command
* Autocomplete snippets for most commands
* Comment toggling using shortcuts (<kbd>Ctrl</kbd>+<kbd>K</kbd>, <kbd>Ctrl</kbd>+<kbd>C</kbd> to comment current line out,  <kbd>Ctrl</kbd>+<kbd>K</kbd>, <kbd>Ctrl</kbd>+<kbd>U</kbd> to remove a comment from current line)

### Screenshots

![](img/preview.gif?raw=true)

![](img/screenshot-syntax-highlighting.png?raw=true)

### Help develop this extension
* Clone from [GitHub](https://github.com/xarantolus/MemeAssembly-vscode)
* Open directory in VSCode
* Press F5 to start VSCode with this extension for debugging
* A new window should open. From there, open some MemeAssembly files/directories, e.g. the ones from [here](https://github.com/xarantolus/memeasm).
* Do changes and reload the window with the extension

### License Notice
This extension is licensed under the MIT license. This excludes the MemeAssembly logo, which is licensed as per the GPLv3-license. See https://www.gnu.org/licenses/.
