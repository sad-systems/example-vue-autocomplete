<template lang="pug">
    div
        h1.main-header Autocomplete demo
        div.main-containter
            Autocomplete(:items="items" :mapper="mapper" :url="url" @change="change" :value="defaultValue")
        div Sed ut perspiciatis, unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa, quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt, explicabo. Nemo enim ipsam voluptatem, quia voluptas sit, aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos, qui ratione voluptatem sequi nesciunt, neque porro quisquam est, qui dolorem ipsum, quia dolor sit, amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt, ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit, qui in ea voluptate velit esse, quam nihil molestiae consequatur, vel illum, qui dolorem eum fugiat, quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus, qui blanditiis praesentium voluptatum deleniti atque corrupti, quos dolores et quas molestias excepturi sint, obcaecati cupiditate non provident, similique sunt in culpa, qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio, cumque nihil impedit, quo minus id, quod maxime placeat, facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet, ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.

</template>

<script lang="ts">
    /*==================================================================================================================
     *  Title      : Main component to demonstrate the Autocomplete component in action
     *  Author     : MrDigger <mrdigger@mail.ru>
     *  Copyright  : © SAD-Systems [http://sad-systems.ru], 2018
     *  Created on : 23.11.2018
     *==================================================================================================================
     */

    import { Component, Vue } from 'vue-property-decorator';

    import Autocomplete  from './components/Autocomplete.vue';
    import { IListItem } from './components/Autocomplete.vue';

    // --- Input demo data:

    interface ICityListItem { Id: number, City: string }  // <--- Work item interface
    const     LIST_FILE_URI = 'kladr.json';               // <--- Work file under the server root
    const     mapper        = function (item: ICityListItem) { return { id: item.Id.toString(), name: item.City } }; // <--- Mapper for work item

    // --- Debug items:
    const testItems = [
        {Id: 0, City: 'example0'},
        {Id: 1, City: 'example1'},
        {Id: 2, City: 'example2'},
        {Id: 3, City: 'example3'},
        {Id: 4, City: 'example4'},
        {Id: 5, City: 'example5'},
        {Id: 6, City: 'example6'},
        {Id: 7, City: 'example7'},
    ];

    // --- Main component:

    @Component({

        data() {
            return {
                url:          LIST_FILE_URI,
                items:        testItems,
                defaultValue: null,
                //defaultValue: {"Id": 6, "City": "example6"}, // <--- To test default value of testItems
                //defaultValue: {"Id": 6, "City": "Майкоп"},   // <--- To test default value of LIST_FILE_URI
            };
        },

        methods: {
            mapper: mapper,
            change(item: IListItem) { console.log('on change: ', item.id, item.name); } // <--- To debug event 'change'
        },

        components: {
            Autocomplete,
        },

    })

export default class App extends Vue {}

</script>

<style lang="scss">

    // --- HTML reset:

    @import "bootstrap/scss/bootstrap-reboot.scss";

    // --- Fonts:

    @import "./fonts.scss";
    @include font-face('Segoe UI', 'assets/fonts/segoe-ui');
    @include font-face('KonturIconic', 'assets/fonts/kontur-iconic-eco-webfont');

    // --- Varibles:

    $block-background-color: #F0F8FF;

    // --- Mixins:

    @mixin main-output-frame() {
        padding:    0.5em;
        text-align: center;
    }

    // --- Classes:

    .main-header {
        @include main-output-frame();
        background: $block-background-color;
        color:      darken($block-background-color, 30%);
    }

    .main-containter {
        @include main-output-frame();
    }

</style>
