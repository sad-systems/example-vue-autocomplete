# Autocomplete component for Vue.js

###### Author: MrDigger <mrdigger@mail.ru>
###### © SAD-Systems [http://sad-systems.ru](), 2018

## Is used

  * [Vue.js](https://vuejs.org/)
  * [Typescript](https://www.typescriptlang.org)
  * [Pug](https://pugjs.org)
    
## Description

> ![English](docs/assets/img/en.gif)

The component implements a select from list UI element with an automatic search.

Sources for the data list:

 - a list specified by array (local filtering)
 - a list received from the server (local filtering)
 - a list received from the server on data in the input field is changed (server side filtering)

Cases to start the first download of the list:

 - on component initialization
 - on component is focused
 - at the first data entry in the input field

It is possible to specify a default value (the `value` property).

If an item from the list is selected the `change` event will be emitted.

The detailed description of the properties and events of the component 
is described in the documentation under the `/docs` folder.
(It's better to see the [live docs](http://examples.sad-systems.ru/autocomplete/docs/))

> ![Russian](docs/assets/img/ru.gif)

Компонент реализует элемент UI "выбор из списка" с авоматическим поиском.

Источники данных:
 - список заданный массивом (локальная фильтрация)
 - список полученный с сервера (локальная фильтрация)
 - список получаемый с сервера при изменении данных в поле ввода (фильтрация на стороне сервера)

Варианты инициации первой загрузки списка:
 - при инициализации компонента
 - при попадании фокуса на компонент
 - при первом вводе данных пользователем в поле ввода
 
Возможно указать значение по умолчанию (свойство `value`).

При выборе элемента из списка срабатывает событие `change`.
 
Более подробное описание свойств и событий компонента описано в документации в папке `/docs`.
(Лучше посмотреть [живую документацию](http://examples.sad-systems.ru/autocomplete/docs/)) 

### Live demo

  Try the [live demo](http://examples.sad-systems.ru/autocomplete/)


### Project documentation

  All the file placed under the `/docs` folder 
  or see the [live docs](http://examples.sad-systems.ru/autocomplete/docs/).
 
### Project source files

  All the file placed under the [/src](./src) folder

### Project build files

 All the file placed under the `/dist` folder.
 To see the working project replace all the files from this 
 folder to the web server document root folder. 

## To developer

### Setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn run serve
```

### Compiles and minifies for production
```
yarn run build
```
