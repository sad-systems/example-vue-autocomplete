# Autocomlete vue-component

###### MrDigger <mrdigger@mail.ru>
###### © SAD-Systems [http://sad-systems.ru](), 2018

## Description

> en

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
is described in the documentation [/docs](./docs).

> ru

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
 
Более подробное описание свойств и событий компонента описано в документации [/docs](./docs). 

### Live demo

  [http://examples.sad-systems.ru/autocomplete/]()

### Project build files

 All the file placed under the [/dist](./dist) folder.
 To see the working project replace all the files from this 
 folder to the web server document root folder.  

### Project documentation

  All the file placed under the [/docs](./docs) folder

### Project source files

  All the file placed under the [/src](./src) folder

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
