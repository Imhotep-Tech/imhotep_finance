# Installation Guide for Imhotep Financial Manager

## Prerequisites
- Ensure you have Node.js and npm installed on your system. You can download them from [Node.js official website](https://nodejs.org/).

## Windows Installation

1. **Download the Installer:**
   - Go to the [Releases](https://github.com/Imhotep-Tech/imhotep_finance/releases) page.
   - Download the latest `Imhotep-Financial-Manager-Setup-<version>.exe` file.

2. **Run the Installer:**
   - Double-click the downloaded `.exe` file.
   - Follow the on-screen instructions to complete the installation.

3. **Launch the Application:**
   - After installation, you can find the Imhotep Financial Manager in your Start Menu.
   - Click to open and start managing your finances.

## Linux Installation

1. **Download the Installer:**
   - Go to the [Releases](https://github.com/Imhotep-Tech/imhotep_finance/releases) page.
   - Download the latest `Imhotep-Financial-Manager-<version>.AppImage` or `.deb` file.

2. **Run the Installer:**
   - For `.AppImage`:
     ```sh
     chmod +x Imhotep-Financial-Manager-<version>.AppImage
     ./Imhotep-Financial-Manager-<version>.AppImage
     ```
   - For `.deb`:
     ```sh
     sudo dpkg -i Imhotep-Financial-Manager-<version>.deb
     sudo apt-get install -f
     ```

3. **Launch the Application:**
   - You can find the Imhotep Financial Manager in your application menu.
   - Click to open and start managing your finances.

## Mac Installation

1. **Download the Installer:**
   - Go to the [Releases](https://github.com/Imhotep-Tech/imhotep_finance/releases) page.
   - Download the latest `Imhotep-Financial-Manager-<version>.dmg` file.

2. **Run the Installer:**
   - Double-click the downloaded `.dmg` file.
   - Drag the Imhotep Financial Manager icon to the Applications folder.

3. **Launch the Application:**
   - Open the Applications folder and find the Imhotep Financial Manager.
   - Double-click to open and start managing your finances.

## Building from Source

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/Imhotep-Tech/imhotep_finance.git
   cd imhotep_finance/electron_app
   ```

2. **Install Dependencies:**
    ```sh
    npm install
    ```
3. **Build the Application:**
    ```sh
    npm run build
    ```
4. **Run the Application:**
    ```sh
    npm start
    ```

## Support
For any issues or questions, please contact Imhotep Tech Support.

