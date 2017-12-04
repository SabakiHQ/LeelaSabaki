# LeelaSabaki

[Leela (Zero)](https://www.sjeng.org/leela.html) integration with [Sabaki](http://sabaki.yichuanshen.de).

![Screenshot](./screenshot.png)

## Installation

- Make sure you have [Sabaki](http://sabaki.yichuanshen.de) v0.32.0 or higher installed.
- Make sure you have the engine only version of [Leela](https://www.sjeng.org/leela.html) or [Leela Zero](https://github.com/gcp/leela-zero) saved somewhere.
- [Download LeelaSabaki](https://github.com/yishn/LeelaSabaki/releases), or build it yourself, for your platform and have the executable file saved somewhere safely. 
- Open Sabaki and open the 'Preferences' drawer by pressing <kbd>Ctrl+,</kbd> or <kbd>Cmd+,</kbd>.
- Click on the 'Engines' path and add a new engine with the following settings:
	- **Path:** Your path to LeelaSabaki
	- **Arguments:** Your path to Leela. Additional command line arguments to Leela can also be appended here. Leela will be called with the `--gtp` option automatically.

## Building

Make sure you have [Node.js](https://nodejs.org/) and npm installed. First, clone LeelaSabaki:

~~~
$ git clone https://github.com/yishn/LeelaSabaki.git
$ cd LeelaSabaki
~~~

Install the dependencies of LeelaSabaki with npm:

~~~
$ npm install
~~~

To build binaries use the following command:

~~~
$ npm run build
~~~

This will create an executable file in `/bin`.
