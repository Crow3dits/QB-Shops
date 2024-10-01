local QBCore = exports['qb-core']:GetCoreObject()

QBCore.Functions.CreateCallback('shops:LoadStoreData', function(source, cb, DisplayName)
    if not Config.Storelist[DisplayName].inuse or Config.Storelist[DisplayName].inuse == source then
        local Player = QBCore.Functions.GetPlayer(source)
        local shopItemCount = LoadData(DisplayName)
        local itemsWithInventoryCount = Config.Storelist[DisplayName].items

        for k, v in pairs(itemsWithInventoryCount) do
            local inventoryItem = Player.Functions.GetItemByName(k)
            if inventoryItem then
                itemsWithInventoryCount[k].inventoryCount = inventoryItem.amount
                if shopItemCount[k] ~= nil then
                    itemsWithInventoryCount[k].count = shopItemCount[k].count 
                else
                    itemsWithInventoryCount[k].count = 0
                end
            else
                print("^8ERROR: ^7This item is not registered in your inventory: ^3" .. k .. "^7")
            end
        end

        cb(true, Config.Storelist[DisplayName], itemsWithInventoryCount)
    else
        cb(false)
    end
end)


AddEventHandler('playerDropped', function(reason)
    local playerId = source -- Get the source of the player who dropped
    
    for k, v in pairs(Config.Storelist) do
        if v.locked == playerId then
            Config.Storelist[k].locked = nil -- Unlock the store if the player was the one who locked it
        end
    end
end)


local shopCountData = {} -- Declare this at the top to maintain state across function calls

function LoadData(DisplayName)
	local loadFile = json.decode(LoadResourceFile(GetCurrentResourceName(), "./data/"..DisplayName..".json"))

	if loadFile == nil then
		-- If there's no saved data, initialize item counts with default amounts
		for k, v in pairs(Config.Storelist[DisplayName].items) do
			shopCountData[k] = {}
			shopCountData[k].count = v.Defaultamount -- Set count to the default amount
		end
		SaveResourceFile(GetCurrentResourceName(), "./data/"..DisplayName..".json", json.encode(shopCountData), -1)
	else
		shopCountData = loadFile
		-- Ensure that all items from the configuration are represented in shopCountData
		for k, v in pairs(Config.Storelist[DisplayName].items) do
			if shopCountData[k] == nil then
				shopCountData[k] = {}
				shopCountData[k].count = v.Defaultamount -- Set count to the default amount if not already present
			end
		end
	end

	return shopCountData
end

function SaveData(DisplayName, data)
	SaveResourceFile(GetCurrentResourceName(), "./data/"..DisplayName..".json", json.encode(data), -1)
end



RegisterServerEvent("shops:Moneycheck")
AddEventHandler("shops:Moneycheck", function(data)
    local xPlayer = QBCore.Functions.GetPlayer(source)

    if data.PaymentID == 1 then
        if xPlayer.PlayerData.money.cash < data.price then
            NotifiServ(source, { title = Config.title, text = Text('notenoughmoney'), icon = 'fa-solid fa-basket-shopping', color = '#ff0000' })
            TriggerClientEvent('shops:CloseStore', source)
        else
            TriggerEvent("shops:buy", source, data, 'money')
        end
    elseif data.PaymentID == 2 then
        if xPlayer.PlayerData.money.bank < data.price then
            NotifiServ(source, { title = Config.title, text = Text('notenoughmoneyinbank'), icon = 'fa-solid fa-basket-shopping', color = '#ff0000' })
            TriggerClientEvent('shops:CloseStore', source)
        else
            TriggerEvent("shops:buy", source, data, 'bank')
        end
    elseif data.PaymentID == 3 then
        -- Assuming you have a way to handle black money if applicable
        local blackMoneyAmount = xPlayer.Functions.GetItemByName('black_money') and xPlayer.Functions.GetItemByName('black_money').amount or 0
        if blackMoneyAmount < data.price then
            NotifiServ(source, { title = Config.title, text = Text('notenoughblackmoney'), icon = 'fa-solid fa-basket-shopping', color = '#ff0000' })
            TriggerClientEvent('shops:CloseStore', source)
        else
            TriggerEvent("shops:buy", source, data, 'black_money')
        end
    end
end)

RegisterServerEvent("shops:buy")
AddEventHandler("shops:buy", function(playerId, data, account)
    if not Config.Storelist[data.DisplayName].transaction then
        Config.Storelist[data.DisplayName].transaction = true
        local xPlayer = QBCore.Functions.GetPlayer(playerId)
        local shopItemCount = LoadData(data.DisplayName)

        for k, v in pairs(data.payData) do
            if account == 'money' then
                xPlayer.Functions.RemoveMoney('cash', tonumber(v.amount) * tonumber(v.price))
            elseif account == 'bank' then
                xPlayer.Functions.RemoveMoney('bank', tonumber(v.amount) * tonumber(v.price))
            elseif account == 'black_money' then
                xPlayer.Functions.RemoveItem('black_money', tonumber(v.amount))
            end
            
            xPlayer.Functions.AddItem(v.name, tonumber(v.amount))
            shopItemCount[v.name].count = tonumber(shopItemCount[v.name].count) - tonumber(v.amount)
        end
        
        SaveData(data.DisplayName, shopItemCount)
        TriggerClientEvent('shops:CloseStore', playerId)
    end
end)


RegisterServerEvent("shops:sell")
AddEventHandler("shops:sell", function(data)
    if not Config.Storelist[data.DisplayName].transaction then
        Config.Storelist[data.DisplayName].transaction = true
        local xPlayer = QBCore.Functions.GetPlayer(source)
        local shopItemCount = LoadData(data.DisplayName)
        local account = nil

        -- Determine the account based on the payment ID
        if data.PaymentID == 1 then
            account = "money"
        elseif data.PaymentID == 2 then
            account = "bank"
        elseif data.PaymentID == 3 then
            account = "black_money"
        end

        -- Process the sale of items
        for k, v in pairs(data.payData) do
            xPlayer.Functions.RemoveItem(v.name, tonumber(v.amount))
            if account == 'money' then
                xPlayer.Functions.AddMoney('cash', tonumber(v.amount) * tonumber(v.price))
            elseif account == 'bank' then
                xPlayer.Functions.AddMoney('bank', tonumber(v.amount) * tonumber(v.price))
            elseif account == 'black_money' then
                xPlayer.Functions.AddItem('black_money', tonumber(v.amount) * tonumber(v.price)) -- Adjust as necessary for how you manage black money
            end
            shopItemCount[v.name].count = tonumber(shopItemCount[v.name].count) + tonumber(v.amount)
        end

        SaveData(data.DisplayName, shopItemCount)
        TriggerClientEvent('shops:CloseStore', source)
    end
end)



RegisterServerEvent("shops:Toggleinuse")
AddEventHandler("shops:Toggleinuse", function(DisplayName)
	Config.Storelist[DisplayName].inuse = source
end)

RegisterServerEvent("shops:Toggleopen")
AddEventHandler("shops:Toggleopen", function(DisplayName)
	Config.Storelist[DisplayName].inuse = nil
	Config.Storelist[DisplayName].transaction = nil
end)

AddEventHandler('onResourceStop', function(resourceName)
	if resourceName == GetCurrentResourceName() then
		for shopName, shop in pairs(Config.Storelist) do
			if shop.Restartrefresh then
				local shopData = {}
				for k, v in pairs(shop.items) do
					shopData[k] = {}
					shopData[k].count = v.Defaultamount -- Reset count to the default amount
				end
				SaveData(shopName, shopData) -- Save the reset data
			end
		end
	end
end)