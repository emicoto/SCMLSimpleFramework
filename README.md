# DOLMods

一些DOL的ML版MOD

下载请到右边release下载，不要从master下载！！

Please download from relase, DO NOT DOWNLOAD FROM MASTER!!

MOD的讨论、反馈用Q群：257791727

## Simple Framework
一个简易的新增内容框架。支持添加：NPC，物品，左侧栏描述、菜单、按钮，模组设置面板支持，新地图入口以及互动点入口等等

只需要把写好的内容入口用widget包装起来，把widget名加到对应的模块队列里就好。

目前支持的模块可以参考temp文件夹里的twee文件。

写法可以参考simple new content文件夹里的文件。

这个MOD必须在排序最前面，但同时必须在汉化MOD之后（避免存在覆盖错误）

更详细的说明可以查看[此处](https://github.com/emicoto/DOLMods/blob/main/Simple%20Frameworks/README.md)


A simple new content framework, designed to support additions such as:

events, items, NPCs, tattoos, explorable locations, interactions in existing locations, and the addition of goods to existing stores, etc.

you can check all supportted zone at widget copy.twee

all you need to do just wrap your content with widget then put your widget's name to the zone array.

you can check the simple new content(a sample mod) to learn how to add your content.

this mod need to be load very early, but need to be load after i18n(if you are using i18n)

More details [here](https://github.com/emicoto/DOLMods/blob/main/Simple%20Frameworks/README.md) (Chinese only now).

## Install Mods
需要ModLoader 2.10版++ 中文版需要汉化MOD。

ModLoader 指路：https://github.com/Lyoko-Jeremie/DoLModLoaderBuild/releases

汉化 指路：https://github.com/Eltirosto/Degrees-of-Lewdity-Chinese-Localization
