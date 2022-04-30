# MemeAssembly Extension for Visual Studio Code
This [extension](https://marketplace.visualstudio.com/items?itemName=xarantolus.memeassembly) provides snippets and syntax highlighting for [MemeAssembly](https://github.com/kammt/MemeAssembly), a highly advanced x86-Assembly based programming language that uses only memes as commands.

### Features
* **Custom commands**
  * **Compile & run the current MemeAssembly** file using the <kbd>Ctrl</kbd>+<kbd>M</kbd> keyboard shortcut
    * You can also open a `.memeasm` file, switch to the command palette and execute the `MemeAssembly: Run current file` command
    * This command automatically finds referenced functions in your workspace files and adds them to the compile command
  * Easy **installation and updates** (for Linux at least)
    * If you don't have the MemeAssembly compiler installed, the extension can install it for you
    * It can also update the compiler any time using `Update MemeAssembly compiler` from the command palette
* **Editor integration**
  * **Autocomplete snippets** for most commands
  * **Hover any command** to get an explanation of what it does
  * **Jump to function definitions & references** using your default "Go to Definition" & "Go to References" shortcuts
  * **Code formatting**
  * **Comment toggling** using default shortcuts
    * <kbd>Ctrl</kbd>+<kbd>K</kbd>, <kbd>Ctrl</kbd>+<kbd>C</kbd> comments the current selection out
    * <kbd>Ctrl</kbd>+<kbd>K</kbd>, <kbd>Ctrl</kbd>+<kbd>U</kbd> to comment the current selection in
  * **Syntax highlighting**
    * Also helps you spot syntax errors in your code (usually marked in red, depending on the theme)

### Screenshots

![](img/preview.gif?raw=true)
The color theme used in the preview above is the [Sunset Theme](https://marketplace.visualstudio.com/items?itemName=swiip.sunset-theme).

![](img/screenshot-syntax-highlighting.png?raw=true)

### Help develop this extension
* Clone from [GitHub](https://github.com/xarantolus/MemeAssembly-vscode)
* Open directory in VSCode
* Press F5 to start VSCode with this extension for debugging
* A new window should open. From there, open some MemeAssembly files/directories, e.g. the ones from [here](https://github.com/xarantolus/memeasm).
* Do changes and reload the window with the extension

### License Notice
This extension is licensed under the MIT license. This excludes the MemeAssembly logo, which is licensed as per the GPLv3-license. See https://www.gnu.org/licenses/.
