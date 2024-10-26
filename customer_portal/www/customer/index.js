const app = Vue.createApp({
delimiters: ['[%','%]'],
    data(){
        return{
            name:'Mututa Paul',
            item_name : 'Rent',
            item_code : 'Rent', 
            image : 'https://anywhere.re/wp-content/uploads/2023/05/633f08923c4c51e97e723cde_State-of-Luxury-Real-Estate-in-Partnership-with-AREAA-2048x1406-1-1024x703.jpeg',
            description : 'This IS COOL',
            properties: []
        }
    },
    computed:{
        compileMarkdown(){
            
        }
    },
    methods:{
        async changeName(){
            let res = await $.ajax({
                url:"/api/method/customer_portal.www.customer.index.get_properties",
                type:"GET"
            
            })
              this.properties = res.message
              console.log(res);
        },
        getRandomPropery(){
            let property = this.properties[Math.floor(Math.random() * 99)]
            // console.log(property);

            this.name ='Mututa Paul'
            // this.item_name = property.item_name
            this.item_code = property.item_code
            // this.description = property.description
            this.image = property.image
       
        }
    },

    mounted(){
        this.changeName();
    }
})

app.mount('#app')