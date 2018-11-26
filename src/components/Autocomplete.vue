<template lang="pug">

    div(:class="_className")

        //--- Input:
        input(@focus="onInputFocus", @blur="onInputBlur", ref="input", v-model="inputValue", :placeholder="placeholder", :class="{error: (errorMessage || noteMessage)}")
        label(@click="onButtonDropDownClick")
        //--- Loader:
        img(src="../assets/loader.gif", v-show="inProgress")
        //--- Dropdown list:
        ul(v-show="isListVisible" @mouseenter="onListMouseEnter" @mouseleave="onListMouseLeave" @wheel.stop.prevent="onListWeel" ref="list")
            li(v-for="item in filteredList", @click="onItemClick(item)", @mouseenter="onItemMouseEnter(item)", :key="item.id", ) {{item.name}}
        //--- Hints:
        div.error-message(v-show="(isListVisible && errorMessage)") {{errorMessage}}
        span.note(v-if="noteMessage" :class="{error: noteMessage}") {{noteMessage}}

</template>

<script lang="ts">
    /**
     * Autocomplete component
     *
     * @author     MrDigger <mrdigger@mail.ru>
     * @copyright  © SAD-Systems [http://sad-systems.ru], 2018
     * @created_on 23.11.2018
     *
     * @module Autocomplete
     * @main   Autocomplete
     *
     * @element Autocomplete
     */

    import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
    import { Observable, of, Subject } from "rxjs";
    import { tap, distinctUntilChanged, debounceTime, catchError, map } from "rxjs/operators";
    import { ajax } from 'rxjs/ajax';
    import { isEqual, filter } from 'lodash';

    //------------------------------------------------------------------------------------------------------------------
    // Environment exports
    //------------------------------------------------------------------------------------------------------------------

    /**
     * @interface IListItem
     */
    export interface IListItem                { id: string, name: string }

    /**
     * @interface IListMapCallbackFunction
     */
    export interface IListMapCallbackFunction { (value: Object, index: number, array: Object[]): IListItem }

    /**
     * @enum InitFetchStrategy
     */
    export enum InitFetchStrategy        { none, onInit, onFocus }

    /**
     * @const Messages
     */
    export const Messages = {
        ERROR_SERVER_RESPONSE:  'Ошибка сервера',
        ERROR_WRONG_DATA:       'Ошибка данных',
        ERROR_TARGET_NOT_FOUND: 'Совпадение не найдено',
        ERROR_LIST_IS_EMPTY:    'Список пуст',
        NOTE_SELECTION_NEEDED:  'Выберите значение из списка',
        PLACEHOLDER:            'Введите или выберите из списка',
    };

    //------------------------------------------------------------------------------------------------------------------
    // Main class
    //------------------------------------------------------------------------------------------------------------------

    /**
     * Autocomplete component
     *
     * @class  Autocomplete
     */
    @Component
    export default class Autocomplete extends Vue {

        /**
         * Main style class of the component
         *
         * @property className
         * @type     string
         * @default  "autocomplete-container"
         */
        @Prop() public className?: string;

        /**
         * Input array of items.
         * Can contain any type of objects.
         *
         * > If input array do not contain `IListItem` objects you have to implement the `mapper` function.
         *
         * @property items
         * @type     Object[]
         * @default  []
         */
        @Prop() public items?: Object[];

        /**
         * Default value.
         * It will be set when component is created
         *
         * @property value
         * @type     any
         * @default  ''
         */
        @Prop() public value?: any;

        /**
         * Mapper function to convert input array of any objects to the array of native objects.
         * The mapper function must implements the `IListMapCallbackFunction` interface.
         *
         * > You do not need to implement this function if you use native IListItem[] in prop `items`
         *   or data received from server.
         *
         * @property mapper
         * @type     IListMapCallbackFunction
         * @default  null
         */
        @Prop() public mapper?: IListMapCallbackFunction;

        /**
         * URL to request data from remote server.
         * If you do not wish to set `items` in your code you can obtain the data from remote server
         * by setting the request URL.
         *
         * @property url
         * @type     string
         * @default  ''
         */
        @Prop() public url?: string;

        /**
         * Flag (true|false).
         *
         * TRUE:  If it is `true` all changes of user input will be send to the remote server
         *        and the response data override the existed item list.
         *        It means the server side filtering.
         *
         * FALSE: If it is `false` all changes of user input will be applied on the locale item list.
         *        It means local filtering.
         *
         * @property serverSearch
         * @type     boolean
         * @default  false
         */
        @Prop({default: false}) public serverSearch?: boolean;

        /**
         * String pattern defines server request param string.
         * This string will be added to the prop `url` opn server request.
         * The user input data replaces `[search]` marker.
         *
         * @property serverParamString
         * @type     string
         * @default  '?key=[search]'
         */
        @Prop({default: '?key=[search]'}) public serverParamString?: string;

        /**
         * Enum {none, onInit, onFocus}
         *
         * Defines the time of initial load the `item list`.
         *
         *  - `onInit`:  means the `item list` will be loaded on component is created.
         *  - `onFocus`: means the `item list` will be loaded on component is first focused. (By default)
         *  - `none`:    means the `item list` will be loaded on user inputs first character.
         *
         * @property InitFetchStrategy
         * @type     InitFetchStrategy
         * @default  onFocus
         */
        @Prop({default: InitFetchStrategy.onFocus}) public InitFetchStrategy?: InitFetchStrategy;

        /**
         * Debounce time interval for user input (in milliseconds)
         *
         * @property bounceDelay
         * @type     number
         * @default  200
         */
        @Prop({default: 200}) public bounceDelay?: number;

        /**
         * The placeholder phrase
         *
         * @property placeholder
         * @type     string
         * @default  Messages.PLACEHOLDER
         */
        @Prop({default: Messages.PLACEHOLDER}) public placeholder?: string;

        /**
         * The array of text messages (errors, notes, hints ...)
         * Use `Messages` object structure to define all existed text messages.
         *
         * @property messages
         * @type     Object
         * @default  Messages
         */
        @Prop() public messages?: Object;

        /**
         * This event is emitted if the item is selected
         *
         * @event change
         * @param {IListItem} item The selected item object
         */
        @Emit('change') public emitChange() { return this.selectedItem; };

        // --- Computed values:

        protected get _className() { return this.className || 'autocomplete-container'; }
        protected get _items()     { return this.dataConverter( this.items, this.mapper ) }
        protected get _messages()  { return { ...Messages, ...this.messages }; }

        // --- UI controls:

        protected inProgress    = false;
        protected isListVisible = false;
        protected errorMessage  = '';
        protected noteMessage   = '';

        // --- Selected Item params:

        protected inputValue     = '';                            // <--- User input
        protected selectedItem: IListItem = { id: '', name: ''};  // <--- Selected object
        protected isItemSelected = false;                         // <--- Selection flag (is the choice made or not)

        // --- Item list:

        protected sourceItemList: IListItem[] = []; // <--- Immutable data (input data)
        protected filteredList:   IListItem[] = []; // <--- Mutable data   (output data) rendered to the view
        protected isFetched = false;

        protected isDefaultValueSet = false;

        // --- Searching value - the Observable instance:

        protected observableSearchValue = new Subject();

        /**
         * `@Watcher`
         * Watches on the user input and emits the 'change' event
         * on the Observable instance to notify all the subscribers
         *
         * @protected
         * @method inputValue
         * @param {string} value
         */
        @Watch('inputValue') protected _inputValue(value: string) { // console.log('changed:', value);

            // --- Ignore the default value set event:     @todo: maybe it should be add a flag `checkDefaultOnInit` in the future
            if (this.value && !this.isDefaultValueSet) {
                return this.isDefaultValueSet = true;
            }

            this.observableSearchValue.next(value);
        }

        // --- Live cycle  ---------------------------------------------------------------------------------------------

        /**
         * `@Hook`
         * The live cycle hook on component is created.
         * Contains the main logic.
         *
         * `overrides`
         *
         * @public
         * @method created
         */
        created() {

            // --- Set defaults:
            this.initDefaultValue();

            // --- Main logic:
            this.observableSearchValue.pipe(
                debounceTime( this.bounceDelay || 0 ),  // <--- Exclude keyboard input bouncing
                distinctUntilChanged( isEqual ),        // <--- Only if value was changed
                this.operator( this.retrieveData )      // <--- Retrieve the data (from server or input list)
            ).subscribe(
                this.createList,                        // <--- Filter the data
                (error) => {},                          // <--- Now just ignore the errors, because they was catched earlier
            );

            // --- Initial action:
            if (this.InitFetchStrategy === InitFetchStrategy.onInit) {
                this.observableSearchValue.next(this.inputValue);
            }

        }

        /**
         * `@Hook`
         * The live cycle hook on component is destroyed.
         *
         * `overrides`
         *
         * @public
         * @method destroyed
         */
        destroyed() {

            this.observableSearchValue.unsubscribe();

        }

        // --- Common helpers  -----------------------------------------------------------------------------------------

        /**
         * Helps to create RXJS operator [http://reactivex.io/rxjs]
         *
         * @protected
         * @method operator
         * @param  {(value: any) => Observable<any>} callback Function returns Observable
         *
         * @return Observable<any>
         */
        protected operator = (callback: (value: any) => Observable<any>) => (input: Observable<any>) => Observable.create((observer: any) => {
            input.subscribe({
                next:     (value: any) => callback(value).subscribe(
                    (value: any) => observer.next(value),
                    (error: any) => observer.error(error),
                ),
                error:    (err: any)   => observer.error(err),
                complete: ()           => observer.complete()
            });
        });

        /**
         * Converts the input data to the internal native format ( Object[] -> IListItem[] )
         *
         * @protected
         * @method dataConverter
         *
         * @param {Object[]}                 inputData
         * @param {IListMapCallbackFunction} mapper
         *
         * @return IListItem[]
         */
        protected dataConverter( inputData?: Object[], mapper?: IListMapCallbackFunction ): IListItem[] {
            return <IListItem[]>( inputData ? ( mapper ? inputData.map( mapper ) : inputData ) : [] );
        }

        /**
         * Creates the request params string based on `serverParamString` pattern
         * and the `searchString`
         *
         * @protected
         * @method createRequestParamString
         *
         * @param {string} searchString
         *
         * @return string
         */
        protected createRequestParamString(searchString?: string): string {
            return searchString ? (this.serverParamString || '').replace('[search]', searchString) : '';
        }

        /**
         * Selects the default value if it exists
         *
         * @protected
         * @method initDefaultValue
         */
        protected initDefaultValue() {
            if (!this.value) return ;
            if (this.value instanceof Object) {
                const item = <IListItem>(this.mapper ? this.mapper( this.value, 0, [ this.value ] ) : this.value);
                this.selectItem( item );
            }
        }

        // --- Core logic ----------------------------------------------------------------------------------------------

        /**
         * Parses the data obtained from server and fill the source list (`sourceItemList`)
         *
         * @protected
         * @method parseServerResponse
         *
         * @param {any} response
         */
        protected parseServerResponse(response: any) {
            this.inProgress = false;
            this.isFetched  = true;
            this.sourceItemList = this.dataConverter( response, this.mapper )
        }

        /**
         * Handles server error
         *
         * @protected
         * @method parseServerError
         *
         * @param {any} error
         *
         * @return Observable<any>
         */
        protected parseServerError(error: any) {
            this.inProgress = false;
            this.throwError(this._messages.ERROR_SERVER_RESPONSE, error);
            return Observable.create( (observer: any) => observer.error(error) ); // <--- Relay the error
        }

        /**
         * Sends the search string (user input) to the remote server.
         * Server side filtering.
         *
         * @protected
         * @method requestToServer
         *
         * @param {string} searchString
         *
         * @return Observable<any>
         */
        protected requestToServer( searchString: string ): Observable<any> { // console.log( 'requestToServer: ', searchString );

            this.isFetched  = false;
            this.inProgress = true;
            return ajax.getJSON( this.url + this.createRequestParamString(searchString) )
                .pipe(
                    tap       ( this.parseServerResponse ),
                    map       ( (response) => searchString ), // <--- Change response to searchString
                    catchError( this.parseServerError ),
                )

        }

        /**
         * Chooses the way to obtain the source data of `item list`:
         *   - from server
         *   - from plain list (prop `items`)
         *
         * @protected
         * @method retrieveData
         *
         * @param {string} searchString
         *
         * @return Observable<any>
         */
        protected retrieveData( searchString: string ): Observable<any> { // console.log( 'retrieveData: ', searchString);

            // --- Clear last selection:
            this.isItemSelected = false;

            // --- Retrieve data from server:
            if (this.url) {

                if (this.serverSearch || !this.isFetched) {
                    return this.requestToServer(searchString);
                }

            // --- Retrieve data from plain list:
            } else {

                this.sourceItemList = this._items;

            }

            return of(searchString);
        }

        /**
         * Local filter.
         * Returns all the items from `item list` containing `searchString` (user input)
         *
         * @protected
         * @method filter
         *
         * @param {string}      searchString
         * @param {IListItem[]} sourceList
         *
         * @return IListItem[]
         */
        protected filter( searchString: string, sourceList: IListItem[] ): IListItem[] {
            this.inProgress = true;
            const filteredList = <IListItem[]>filter(sourceList, (item: IListItem) => item.name.indexOf(searchString) != -1 );
            this.inProgress = false;                               // console.log( 'filter: OK' );
            return filteredList;
        }

        /**
         * Creates a final filtered item list to render (`filteredList`).
         * Selects the type of filtering:
         *   - server side
         *   - client side (local filter)
         *
         * @protected
         * @method createList
         *
         * @param {string} searchString
         */
        protected createList( searchString: any ) {                // console.log( 'filter: ', searchString );

            this.hideError();

            if (!this.sourceItemList.length) {
                this.throwError(this._messages.ERROR_LIST_IS_EMPTY);
            }

            if (this.serverSearch || (searchString == '') ) {
                // --- (No filter) Server side filtering:
                this.filteredList = this.sourceItemList;
            } else {
                // --- Local filtering:
                this.filteredList = this.filter(searchString, this.sourceItemList);

                // --- Wrong searchString:
                if (!this.filteredList.length && this.sourceItemList.length) {
                    this.throwError(this._messages.ERROR_TARGET_NOT_FOUND);
                }
            }

        }

        // --- Actions -------------------------------------------------------------------------------------------------

        /**
         * Sets the given item as selected.
         *
         * @protected
         * @method selectItem
         *
         * @param {IListItem} item
         */
        protected selectItem(item: IListItem) {
            this.inputValue     = item.name;
            this.selectedItem   = item;
            this.isItemSelected = true;
            this.emitChange();
        }

        /**
         * Selects an item automatically.
         * (Gets the first item from the item list filtered by user input)
         *
         * @protected
         * @method autoSelectItem
         */
        protected autoSelectItem() {
            if ( (!this.isItemSelected) && this.inputValue) {
                const items = this.filter(this.inputValue, this.sourceItemList);
                if (items.length > 0) {
                    this.selectItem( items[0] );                   // console.log('AUTOSELECT OK:', items[0].name);
                }
            }
        }

        /**
         * Creates note messages
         *
         * @protected
         * @method getNote
         */
        protected getNote () {

            this.noteMessage = ''; // <--- Clear an old note

            // --- Conditions to create a new note:

            if (!this.isItemSelected) {
                this.noteMessage = this._messages.NOTE_SELECTION_NEEDED;
            }

        }

        // --- UI event handlers ---------------------------------------------------------------------------------------

        protected onButtonDropDownClick() {
            (<HTMLElement>this.$refs.input).focus();
        }

        protected onInputFocus() {

            this.hideNote();
            this.showList();

            if (this.InitFetchStrategy === InitFetchStrategy.onFocus) {
                this.observableSearchValue.next(this.inputValue);
            }

        }

        protected onInputBlur(event: any) {

            if (!this.isMouseInListArea) {
                this.hideList();
                this.autoSelectItem()
                this.getNote();
            }

        }

        protected onItemClick(item: Object) {
            this.selectItem(<IListItem>item);
            this.hideList();
        }

        protected onItemMouseEnter(item: Object) {
            // ... to the future
        }

        protected onListWeel(event: WheelEvent) {
            (<HTMLElement>this.$refs.list).scrollTop += event.deltaY; // <--- Scroll emulation
        }

        private   isMouseInListArea = 0; // <--- To control the mouse pointer

        protected onListMouseEnter() { this.isMouseInListArea = 1; }

        protected onListMouseLeave() { this.isMouseInListArea = 0; }

        // --- UI controls ---------------------------------------------------------------------------------------------

        protected showList() {
            this.isListVisible = true;
        }

        protected hideList() {
            this.isListVisible = false;
        }

        protected throwError(message: string, details?: any) {
            this.errorMessage = message; // console.error('MESSAGE: ', message, );
        }

        protected hideError() {
            this.errorMessage = '';
        }

        protected showNote(message: string) {
            this.noteMessage = message;
        }

        protected hideNote() {
            this.noteMessage = '';
        }

    }

</script>

<style lang="scss">

    // --- Variables:

    $font-size:             14px;
    $font-name:             'Segoe UI';
    $line-height:           20px;
    $width:                 20em;
    $height:                $line-height + $font-size;
    $height-max-dropdown:   200px;
    $normal-color:          #404040;
    $active-color:          #57b1ff;
    $active-contrast:       #fff;
    $background-color:      #fff;
    $decoration-color:      lighten($normal-color, 60%);
    $error-color:           #f00;
    $error-text-color:      darken($decoration-color, 30%);
    $plain-text-color:      $normal-color;
    $item-text-color:       $plain-text-color;
    $item-hover-text-color: $active-contrast;
    $item-hover-bg-color:   $active-color;

    // --- Main component container:
    .autocomplete-container {

        display:  inline-block;
        position: relative;

        // --- Common for all the children elements:
        * {

            font:        $font-size $font-name;
            color:       $plain-text-color;
            line-height: $line-height;
            background-color: $background-color;

        }

        // --- Input field:
        input {
            width:   $width;
            padding: 0.5em 2.25em 0.5em 0.75em;
            border:  solid 1px $decoration-color;
            outline-color: transparent;

            &:focus, &:hover {
                border:     solid 1px $active-color;
                box-shadow: 0 0 0 1px $active-color;
            }

            &.error {
                color:   $error-color;
                border:  solid 1px $error-color;
                box-shadow: 0 0 0 1px $error-color;

            }
        }

        // --- Drop down button:
        input + label {
            color:     $decoration-color;
            position:  relative;
            right:     1.75em;
            cursor:    pointer;

            // --- Arrow down symbol:
            &:before {
                font-family: KonturIconic;
                content: '\E04C';
            }
        }

        // --- Loader:
        input + label + img {
            position: absolute;
            right:    1.75em;
            top:      0.85em;
            width:    1em;
            height:   1em;
        }

        // --- Drop down list:
        ul {
            display:         block;
            position:        absolute;
            width:           $width;
            border:          solid 1px $decoration-color;
            box-shadow:      0px 2px 3px 2px rgba(0, 0, 0, 0.07);
            padding:         0;
            list-style-type: none;
            max-height:      $height-max-dropdown;
            overflow:        auto;

            // --- List item:
            li {
                padding:    0.5em 0.75em;
                text-align: left;

                &:hover {
                    background-color: $item-hover-bg-color;
                    color:            $item-hover-text-color;
                    cursor:           pointer;
                }
            }
        }

        // --- Error message:
        .error-message {
            display:         block;
            position:        absolute;
            width:           $width;
            border:          solid 1px $decoration-color;
            box-shadow:      0px 2px 3px 2px rgba(0, 0, 0, 0.07);
            padding:         0.5em 1em;
            color:           $error-text-color;
            text-align:      left;
        }

        // --- Note message:
        .note {
            display:    block;
            text-align: left;
            padding:    0.5em 1em;

            &.error {
                color:  $error-color;
            }
        }

    }

</style>
