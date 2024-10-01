fx_version 'bodacious'
games { 'gta5' }

author 'K5 and Est-Scripts'
version '1.1.1'
lua54 'yes'

client_scripts {
    'client/*.lua'
}

server_scripts {
    'server/*.lua'
}

shared_scripts { 
    '@ox_lib/init.lua',
    'shared/*.lua'
    }

ui_page "html/index.html"

files({
    'html/**',
    'data/*.json'
})
