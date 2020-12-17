'use strict';
 
module.exports = {
	metadata: () => ({
		name: 'compensar.check.affiliations',
		properties: {
			typeDoc: { required: true, type: 'string' },
			doc: { required: true, type: 'string' },
			AFILIADO: { required: true, type: 'string' }
		},
		supportedActions: ['natural', 'espcial', 'noExist', 'nit', 'sendMsm']
	}),
	invoke: (conversation, done) => {

		const access  = '',
		secret  = '',
		fileName = 'pruafiliados.csv',
		myBucket  = 'afiliaciones',
		{doc, AFILIADO, typeDoc} = conversation.properties();

		var AWS = require('aws-sdk');
		var readline  = require('readline');

		// contadores
		let counter = 0;
	
		// titulos
		let titles = [];
	
		// afiliado
		let affiliate_d = {};

		// docs
		let typeDocs = {
			'action1': 'CC', // natural
			'action2': 'CE', // natural
			'action3': 'PASS', // espcial
			'action4': 'NIT', // nit
			'action5': 'PE' // espcial
		};

		try {
		
		// conexion con s3
		const s3 = new AWS.S3({
			accessKeyId: access,  
			secretAccessKey: secret
		});

		const readStream = s3.getObject({
			Bucket: myBucket,
			Key: fileName
		}).createReadStream()
		
		// Leemos el archivo que esta en s3
		const rl = readline.createInterface({
			input: readStream
		});
		
		// lee cada linea
		rl.on('line', function(line) {
			counter++
			let lineS = line.split('|')
			if(counter == 1){
				titles = lineS
			}else{
		
			// buscamos en la linea si pertenece al documento
				let count = 0
				if(lineS[4] == doc){

					// rl.pause();

					titles.forEach(title => {
						affiliate_d[title] = lineS[count]
						count++
					});

					// si encontramos el documento terminamos de leer el archivo
					// rl.close();
					// rl.removeAllListeners();
					// readStream.destroy();
					return
				}
			
			}
			
		})
		.on('close', function() {

			if(affiliate_d.PRI_NOM){

				let nameA = affiliate_d.PRI_NOM + ' ' + affiliate_d.SEG_NOM + ' ' + affiliate_d.PRI_APELLIDO + ' ' + affiliate_d.SEG_APELLIDO;
				let nameB = affiliate_d.PRI_NOM + ' ' + affiliate_d.PRI_APELLIDO

				// objeto a entregar
				let _dataAff = {};
				_dataAff['NOMBRE']                = nameB;
				_dataAff['NOMBRE_COMPLETO']       = nameA;
				_dataAff['TIPO_AFILIACION']       = affiliate_d.TIPO_AFILIACION;
				_dataAff['CATEGORIA_AFILIACION']  = affiliate_d.CATEGORIA_AFILIACION;
				_dataAff['EMAIL']                 = affiliate_d.EMAIL;
				_dataAff['SUBSIDIO_VIVIENDA']     = affiliate_d.SUBSIDIO_VIVIENDA;
				_dataAff['AUTORIZACION_CELULAR']  = affiliate_d.AUTORIZACION_CELULAR;

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

				// vamos a revisar en el consolidador si hay mensajes pendientes (EN CONSTRUCCIÓN)
				// var request = require('request');

				// request.post(
				// 	'http://www.yoursite.com/formpage',
				// 	{ json: { key: 'value' } },
				// 	function (error, response, body) {
				// 		if (!error && response.statusCode == 200) {
				// 			console.log(body);
				// 		}
				// 	}
				// );

				// temporalmente vamos a decir que si hay notificaciones
				transition = 'sendMsm'

				// contestamos
				conversation
					.reply(`Hola ` + nameA + ', '+ typeDocs[typeDoc] +' tu afiliación esta activa y tu categoria de afiliación es ' + affiliate_d.CATEGORIA_AFILIACION + " ¿sobre qué quieres conocer?")
					.variable(AFILIADO, _dataAff);
					// Navigate to next state without 
					// first prompting for user interaction.
					// .keepTurn(true)
					// .transition(transition);

					let actions = [];
					actions.push(conversation.MessageModel().postbackActionObject("Si", null, { isNo: false }));
					actions.push(conversation.MessageModel().postbackActionObject("No", null, { isNo: true }));
					let buttonMessage = conversation.MessageModel().textConversationMessage("¿Tenemos una información importante para ti, ¿quieres recibirla?", actions, null);
					conversation.reply(buttonMessage);
					// Although reply() automatically sets keepTurn to false, 
					// it's good practice to explicitly set it so that it's
					// easier to see how you intend the component to behave.

					conversation.keepTurn(false);
					conversation.transition(transition);
			
			}else{

				let state = ''
				if(typeDocs[typeDoc] == 'nit'){
					state = ''
				}else{
					state = ''
				}

				// reply
				conversation
					.reply(`Hola No encontramos registro de afiliación` )
					// Navigate to next state without 
					// first prompting for user interaction.
					.keepTurn(true)
					.transition(state);
				}
				
				// termina la interaccion
				done();
			});

			} catch (error) {

			// reply
			conversation
				.reply(`Hola ${doc}`)
				.reply(`Hay un problema ${error}`)
				.transition('noExist');

			done();
		}
		
	}
};
