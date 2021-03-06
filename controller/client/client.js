'use strict'

import ClientModel      from '../../models/client/client'
import DeviceModel      from '../../models/device/device'
import ChannelPathModel from '../../models/setting/channelpath'

class client {
    constructor(){
        //console.log('init 111');
    }
    
    async list(req, res, next){
        try{
            var gwId = req.body.gwId;
            const gwClients = await ClientModel.find({gwId: gwId});    
            res.send({ret_code: 0, ret_msg: 'SUCCESS', extra: {gwClients}});
            return;
        }catch(err){
            console.log(err);
        }
        
        res.send({ret_code: 1002, ret_msg: 'FAILED', extra: '用户输入参数无效'});
    }
    
    async updateDeviceClientFromCounterV2(body) {
		console.log(body);
        var res_auth = {};
        var gwId = body.gw_id;
        var clients_info = body.clients;
        res_auth['gw_id'] = gwId;
        res_auth['auth_op'] = [];
        
        try{
            for(var i=0; i < clients_info.length; i++){
                var client = clients_info[i];
                var id              = client.id;
                var mac 	        = client.mac;
			    var ip		        = client.ip;
                var token	        = client.token;
                var wired	        = client.wired;
                var name	        = client.name;
                var incoming	    = client.incoming;
                var outgoing	    = client.outgoing;
                var firstLogin	    = client.first_login;
                var onlineTime	    = client.online_time;
				var now             = new Date();
                var nowTime	        = now.getTime();
                var lastTime        = Math.round(+new Date()/1000);
                var auth_code = {};
                auth_code.id = id;
                auth_code.auth_code  = 0;
                
                var newClient = {
                    gwId: gwId,
                    clients:{
                        'mac': mac,
                        'ip': ip,
                        'token': token,
                        'wired': wired,
                        'name': name,
                        'incoming': incoming,
                        'outgoing': outgoing,
                        'firstLogin': firstLogin,
                        'onlineTime': onlineTime,
                        'lastTime': nowTime
                    }
                };

                const device = await ClientModel.findOne({'gwId': gwId,'clients.mac': mac});
                if(!device){
                    await ClientModel.create(newClient);
                    auth_code.auth_code = 1;
                	res_auth['auth_op'].push(auth_code);
					continue;
                }

                var duration = 0;
                var cpSetting;
                var gwSetting = await DeviceModel.findOne({'gwId': gwId});
                if(!gwSetting){
                    console.log('impossible: cannot find setting of gateway');
                	res_auth['auth_op'].push(auth_code);
					continue;
                }else{ 
                    cpSetting = await ChannelPathModel.findOne({channelPath: gwSetting.channelPath});
                    if(!cpSetting){
                        console.log('impossible: cannot find setting of channelPath');
                		res_auth['auth_op'].push(auth_code);
                        continue;
                    }else{
                        duration = cpSetting.duration;
                    }
                }

                if(duration < (lastTime - firstLogin)){
                    console.log('client timeout ' + mac);
                	res_auth['auth_op'].push(auth_code);
                    continue;
                } 

                await ClientModel.findOneAndUpdate({'gwId': gwId,'clients.mac': mac}, {$set: newClient});
                auth_code.auth_code = 1;
                res_auth['auth_op'].push(auth_code);
            }
        }catch(err){
            console.log(err);
        }
        
        return res_auth;
    }
    
	async updateDeviceClientFromCounter(query) {
		try {
			var mac 	        = query.mac;
			var ip		        = query.ip;
			var token	        = query.token;
			var wired	        = query.wired;
			var name	        = query.name;
			var gwId	        = query.gw_id;
			var incoming	    = query.incoming;
			var outgoing	    = query.outgoing;
			var firstLogin	    = query.first_login;
			var onlineTime	    = query.online_time;
			var now             = new Date();
            var nowTime	        = now.getTime();
			var lastTime        = Math.round(+new Date()/1000);

			var newClient = {
				gwId: gwId,
				clients:{
					'mac': mac,
					'ip': ip,
					'token': token,
					'wired': wired,
					'name': name,
					'incoming': incoming,
					'outgoing': outgoing,
					'firstLogin': fristLogin,
					'onlineTime': onlineTime,
					'lastTime': nowTime
				}
			};
			const device = await ClientModel.findOne({'gwId': gwId,'clients.mac': mac});
			if(!device){
				await ClientModel.create(newClient);
				return 1;
			}
            
			var duration = 0;
			var cpSetting;
			var gwSetting = await DeviceModel.findOne({'gwId': gwId});
			if(!gwSetting){
				console.log('impossible: cannot find setting of gateway');
				return 0;
			}else{ 
				cpSetting = await ChannelPathModel.findOne({channelPath: gwSetting.channelPath});
				if(!cpSetting){
					console.log('impossible: cannot find setting of channelPath');
					return 0;
				}else{
					duration = cpSetting.duration;
				}
			}

			if(duration < (lastTime - firstLogin)){
				console.log('client timeout ' + mac);
				return 0;
			}

			await ClientModel.findOneAndUpdate({'gwId': gwId,'clients.mac': mac}, {$set: newClient});
			return 1;
		}catch(err){
			console.log(err);
			return 0;
		}
	}
}

const Client = new client();

export default Client;
