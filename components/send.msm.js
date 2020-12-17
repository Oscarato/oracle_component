'use strict';
 
module.exports = {
	metadata: () => ({
		name: 'compensar.send.msm',
		properties: {
            typeDoc: { required: true, type: 'string' },
            doc: { required: true, type: 'string' },
			phone: { required: true, type: 'integer' },
		},
		supportedActions: ['natural', 'espcial', 'noExist', 'nit']
	}),
	invoke: (conversation, done) => {

        const {doc, typeDoc, phone} = conversation.properties();

		// docs
		let typeDocs = {
			'action1': 'CC', // natural
			'action2': 'CE', // natural
			'action3': 'PASS', // espcial
			'action4': 'NIT', // nit
			'action5': 'PE' // espcial
        };
        
        // definimos que estado pasar de acuerdo al tipo de documento
        let transition = ''
        switch (typeDocs[typeDoc]) {
            case 'CC':
            transition = 'natural'
            break;

            case 'CE':
            transition = 'natural'
            break;

            case 'PASS':
            transition = 'espcial'
            break;

            case 'NIT':
            transition = 'nit'
            break;

            case 'PE':
            transition = 'espcial'
            break;
        
            default:
            break;
        }

        // si contestaron que no
        if (conversation.postback() && !conversation.postback().isNo) {

            conversation.keepTurn(true);
            conversation.transition(transition);
            done();

        } else {

            const https = require('https');
            var request = require('request');
            var fs = require('fs');
        
            https.globalAgent.options.ca = fs.readFileSync('node_modules/node_extra_ca_certs_mozilla_bundle/ca_bundle/ca_intermediate_root_bundle.pem');
        
            // conexion con ITUS
            var data = {
                "grant_type": "client_credentials", 
                "client_id": "4",
                "client_secret": "r5MqyEDzUt4XKxZoms5dgPh9v0y3qJUXgJWF4RQx"
            };
            
            // tramos primero el token
            request({
                "url": 'https://dev.itus.com.co:4430/oauth/token',
                "method": "POST",
                "json": data,
                "headers":{
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest"
                },
            }, function(err, response, body){
        
                console.log(' TOKEN ')
                
                console.log(' BODY ')
            
                // si todo salio bien, buscamos si hay notificaciones
                if(body.token_type){
            
                    // let json = {
                    //   document_id: document,
                    //   document_type: 'CC'
                    // }

                    let json = {
                        "document_id": document,
                        "document_type": "1",
                        "phone": phone,
                        "message": "Enviar mensaje de texto a este numero",
                        "business_cycle": "AFILIACION",
                        "marker": "MM_IVR",
                        "originator": "WEB"
                    }
            
                    request({
                        "url": 'https://dev.itus.com.co:4430/api/send_sms',
                        "method": "POST",
                        "json": json,
                        "headers":{
                            "Content-Type": "application/json",
                            "X-Requested-With": "XMLHttpRequest",
                            "Authorization": "Bearer " + body.access_token
                        },
                    }, function(err, response, body){
                
                        console.log(' NORIFICACIONES ')
                        
                        console.log(' BODY ')
                        
                        console.log(body);
                
                        // contestamos
                        conversation
                            .reply('Te hemos enviado la notificación. ¿sobre qué quieres conocer?')
                            // Navigate to next state without 
                            // first prompting for user interaction.
                            .keepTurn(true)
                            .transition(transition);
                    });
            
                }
                
            });
        }
        
	}
};
