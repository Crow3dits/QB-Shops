function Text(key, ...)
    local translation = Config.Locales[Config.Lang][key]
    if translation then
        return (translation):format(...)
    else
        return 'Not locale: ' .. key
    end
end

Config.title = "Store"

Config.Locales = {
    ['EN'] = {
        inuse = "Shop is already opened by somebody, please wait!",
        openShop = "[E] - Open Store",
        notenoughmoney = "You do not have enough money",
        notenoughmoneyinbank = "You do not have enough money on bank balance",
        notenoughblackmoney = "You do not have enough black money",
    },
}
