local QBCore = exports['qb-core']:GetCoreObject()

local Storeinuse = nil


-- Display TextUI
Citizen.CreateThread(function()
    local Text1 = nil
    local Area = nil 
    while true do
        local Zone = false 
        Citizen.Wait(0)

        local playerPos = GetEntityCoords(PlayerPedId())

        for k, v in pairs(Config.Storelist) do
            local distance = #(v.Position - playerPos)
            if distance < v.Distancetoseller then
                Zone = true 
                Text1 = Text("openShop")
            end
        end
        
        if not Area and Zone then
            Area = true
            lib.showTextUI(Text1, {
                icon = 'fa-solid fa-basket-shopping',
            })
        end
    
        if Area and not Zone then
            Area = false 
            lib.hideTextUI()
        end
    end
end)

Citizen.CreateThread(function()
    while true do
        local sleep = 1000
        local playerPos = GetEntityCoords(PlayerPedId())

        for k, v in pairs(Config.Storelist) do
            local distance = #(v.Position - playerPos)
            if distance < v.Distancetoseller then
                sleep = 1
                if IsControlJustReleased(0, 38) then
                    QBCore.Functions.TriggerCallback('shops:LoadStoreData', function(open, shopData, itemsWithInventoryCount)
                        if open then
                            local shopData = v
                            shopData.items = itemsWithInventoryCount
                            shopData.shopId = k
                            Storeinuse = k
                            TriggerServerEvent("shops:Toggleinuse", Storeinuse)
                            SetNuiFocus(true, true)
                            SendNUIMessage({
                                action = "open",
                                data = shopData
                            })
                        else
                            Notifi({ title = Config.title, text = Text('inuse'), icon = 'fa-solid fa-basket-shopping', color = '#94fc03' })
                        end
                    end, k)
                end
            end
            if distance >= 3.0 and Storeinuse == k then
                lib.hideTextUI()
                CloseStore()
            end
        end
        Citizen.Wait(sleep)
    end
end)

Citizen.CreateThread(function()
    for k, v in pairs(Config.Storelist) do
        if v.BlipSettings then
            local blip = AddBlipForCoord(v.Position)

            SetBlipSprite(blip, v.BlipSettings.SpriteID)
            SetBlipScale(blip, v.BlipSettings.ScaleFactor)
            SetBlipColour(blip, v.BlipSettings.ColorID)
            SetBlipAsShortRange(blip, true)

            BeginTextCommandSetBlipName("STRING")
            AddTextComponentString(v.BlipSettings.StoreBlipName)
            EndTextCommandSetBlipName(blip)
        end
        if v.SellerNPC then
            SpawnPed(v.SellerNPC)
        end
    end
end)

function SpawnPed(data)
    RequestModel(data.Model)
    while not HasModelLoaded(data.Model) do
        Wait(100)
    end
    if HasModelLoaded(data.Model) then
        local ped = CreatePed(1, data.Model, data.Location.x, data.Location.y, data.Location.z, data.HeadingDirection, false, true)

        SetBlockingOfNonTemporaryEvents(ped, true)
        SetPedDiesWhenInjured(ped, false)
        SetPedCanPlayAmbientAnims(ped, true)
        SetPedCanRagdollFromPlayerImpact(ped, false)
        SetPedCanBeTargetted(ped, false)
        SetEntityInvincible(ped, true)
        FreezeEntityPosition(ped, true)
        if data.Animation then
            RequestAnimDict(data.Animation.Dict)
            while not HasAnimDictLoaded(data.Animation.Dict) do
                Wait(100)
            end
            TaskPlayAnim(ped, data.Animation.Dict, data.Animation.Name, 8.0, -8.0, -1, 1, 0, false, false, false)
        end
    else
        print("Failed to load model: " .. data.Model)
    end
end

RegisterNetEvent('shops:ResetStore')
AddEventHandler('shops:ResetStore', function(DisplayName)
    QBCore.Functions.TriggerCallback('shops:LoadStoreData', function(shopData, itemsWithInventoryCount)
        local shopData = Config.Storelist[DisplayName]
        shopData.items = itemsWithInventoryCount
        shopData.shopId = DisplayName
        SendNUIMessage({
            action = "reset",
            data = shopData
        })
    end, DisplayName)
end)

RegisterNUICallback("action", function(data, cb)
	if data.action == "close" then
		CloseStore()
    elseif data.action == "buy" then
        TriggerServerEvent("shops:Moneycheck", data.data)
    elseif data.action == "sell" then
        TriggerServerEvent("shops:sell", data.data)
    end
end)

function CloseStore()
    SendNUIMessage({
        action = "close"
    })
    SetNuiFocus(false, false)
    TriggerScreenblurFadeOut(1000)
    TriggerServerEvent("shops:Toggleopen", Storeinuse)
    Storeinuse = nil
end

RegisterNetEvent('shops:CloseStore')
AddEventHandler('shops:CloseStore', function()
    TriggerServerEvent("shops:Toggleopen", Storeinuse)
    CloseStore()
end)
