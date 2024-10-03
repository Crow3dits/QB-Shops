var data
var cartData = {}
var sellButtonLocked = false
var buyButtonLocked = false

const getCartData = () => {
  cartData = {}
  Object.keys(data.items).forEach((key, index) => {
    cartData[key] = {
      ItemLabel: data.items[key].ItemLabel,
      count: 0,
      IsUnlimited: data.IsUnlimited,
      BPrice: data.items[key].BPrice,
      SPrice: data.items[key].SPrice,
      dbCount: data.items[key].count,
      max: data.items[key].MaxAmount,
      inventoryCount: data.items[key].inventoryCount,
    }
  })
}


window.addEventListener('message', function (event) {
  var msg = event.data
  if (msg.action == 'open') {
    data = msg.data
    open(data)
  }
  if (msg.action == 'reset') {
    data = msg.data
    open(data)
  }
  if (msg.action == 'close') {
    sellButtonLocked = false
    buyButtonLocked = false
    hideAll()
  }
})

$(() => {
  document.onkeyup = function (data) {
    if (data.which == 27) {
      closeEsc()
    }
  }
})

const open = (data) => {
  //Generate shop data
  closeModal()
  $('.menu-list').html('')
  $('.wrapper').css('display', 'flex')
  $('#DisplayName').html(data.DisplayName)
  $('#logo').attr('src', `img/${data.shopId}.png`)

  $('#exit-button').on('click', function () {
    close()
  })

  //Generate menu

  if (!data.Nobuying) {
    $('.menu-list').append(buyMenu)
    $('#buymenu').on('click', function () {
      setUpBuyPage(cartData)
    })
  }

  let isInJob = false
  if (data.sellJob) {
    data.sellJob.forEach((job) => {
      if (data.playerJob == job) isInJob = true
    })
  }

  if (isInJob || data.sellJob === undefined || data.Nobuying) {
    $('.menu-list').append(sellMenu)

    $('#sellmenu').on('click', function () {
      setUpSellPage()
    })
  }

  //Generate buy from shop grid
  data.Nobuying ? setUpSellPage() : setUpBuyPage(cartData)
}

const close = () => {
  $.post(
    `https://${GetParentResourceName()}/action`,
    JSON.stringify({
      action: 'close',
    })
  )
}

const closeEsc = () => {
  if ($('.modal-wrapper').css('display') === 'flex') {
    $('.modal-wrapper').css('display', 'none')
  } else {
    $.post(
     `https://${GetParentResourceName()}/action`,
      JSON.stringify({
        action: 'close',
      })
    )
  }
}

const hideAll = () => {
  $('.wrapper').css('display', 'none')
  $('.modal-wrapper').css('display', 'none')
}



const setUpBuyPage = () => {
  //Generate menu
  $('.menu-element').removeClass('active')
  $('#buymenu').addClass('active')
  $('.grid').html('')

  //Generate grid cards
  Object.keys(data.items)
    .sort(function (a, b) {
      if (data.items[a].ItemLabel < data.items[b].ItemLabel) {
        return -1
      }
      if (data.items[a].ItemLabel > data.items[b].ItemLabel) {
        return 1
      }
      return 0
    })
    .forEach((key, i) => {
      if (data.items[key].BPrice !== undefined) {
        $('.grid').append(
          genCard(
            i,
            key,
            data.items[key].ItemLabel,
            data.items[key].count,
            data.items[key].MaxAmount,
            data.items[key].BPrice,
            data.items[key].inventoryCount,
            'buy',
            data.IsUnlimited,
            data.PaymentID
          )
        )
      }
    })

  getCartData()
  $('.details').html(genCartBuy(cartData))
  setBuyButton()

  //Add grid card button functionalities
  $('.buy-minus').on('click', function () {
    let productName = $(this).data('product')
    let oldValue = cartData[productName].count

    let newValue = parseInt(oldValue) - 1

    if (newValue >= 0) {
      $(`.product-price-input[data-product="${productName}"]`).val(newValue)
      cartData[productName].count = parseInt(newValue)
      $('.details').html(genCartBuy(cartData))
      setBuyButton()
    }
  })

  $('.buy-plus').on('click', function () {
    let productName = $(this).data('product')
    if (data.IsUnlimited) {
      let oldValue = cartData[productName].count
      let newValue = parseInt(oldValue) + 1
      $(`.product-price-input[data-product="${productName}"]`).val(newValue)
      cartData[productName].count = parseInt(newValue)
      $('.details').html(genCartBuy(cartData))
      setBuyButton()
    } else if (cartData[productName].dbCount > 0) {
      let oldValue = cartData[productName].count

      let newValue = parseInt(oldValue) + 1

      if (newValue <= cartData[productName].dbCount) {
        $(`.product-price-input[data-product="${productName}"]`).val(newValue)
        cartData[productName].count = parseInt(newValue)
        $('.details').html(genCartBuy(cartData))
        setBuyButton()
      }
    }
  })

  $('.product-price-input').on('input', function () {
    let productName = $(this).data('product')

    $(this).val(Math.round($(this).val()))

    if (data.IsUnlimited) {
      if ($(this).val() < 0) {
        $(this).val(0)
      }

      cartData[productName].count = parseInt($(this).val())
      $('.details').html(genCartBuy(cartData))
      setBuyButton()
    } else {
      if ($(this).val() > cartData[productName].dbCount) {
        $(this).val(cartData[productName].dbCount)
      }
      if ($(this).val() < 0) {
        $(this).val(0)
      }
      cartData[productName].count = parseInt($(this).val())
      $('.details').html(genCartBuy(cartData))
      setBuyButton()
    }
  })
}

const setBuyButton = () => {
  $('#pay-button').html(locale[lang].buyButton)
  $('#pay-button').unbind()
  $('#pay-button').on('click', function () {
    openModal(
      locale[lang].buyTitle,
      locale[lang].buyQuestion,
      function () {
        if (!buyButtonLocked) {
          buyButtonLocked = true
          let payData = Object.keys(cartData)
            .filter((key) => cartData[key].count > 0)
            .map((key) => ({
              name: key,
              amount: cartData[key].count,
              price: cartData[key].BPrice,
            }))
          let totalPrice = 0
          Object.keys(cartData)
            .filter((key) => cartData[key].count > 0)
            .forEach((key) => {
              totalPrice += cartData[key].BPrice * cartData[key].count
            })

          if (payData.length) {
            $.post(
              `https://${GetParentResourceName()}/action`,
              JSON.stringify({
                action: 'buy',
                data: {
                  DisplayName: data.shopId,
                  price: totalPrice,
                  PaymentID: data.PaymentID,
                  payData: payData,
                },
              })
            )
          } else {
            openModal(locale[lang].error, locale[lang].emptyCart)
          }
        }
      },
      closeModal,
      locale[lang].yes,
      locale[lang].cancel
    )
  })
}

const setUpSellPage = () => {
  $('.menu-element').removeClass('active')
  $('#sellmenu').addClass('active')
  $('.grid').html('')

  //Generate grid cards
  Object.keys(data.items)
    .sort(function (a, b) {
      if (data.items[a].ItemLabel < data.items[b].ItemLabel) {
        return -1
      }
      if (data.items[a].ItemLabel > data.items[b].ItemLabel) {
        return 1
      }
      return 0
    })
    .forEach((key, i) => {
      if (data.items[key].SPrice !== undefined) {
        $('.grid').append(
          genCard(
            i,
            key,
            data.items[key].ItemLabel,
            data.items[key].count,
            data.items[key].MaxAmount,
            data.items[key].SPrice,
            data.items[key].inventoryCount,
            'sell',
            data.IsUnlimited,
            data.PaymentID
          )
        )
      }
    })

  getCartData()
  $('.details').html(genCartSell(cartData))
  setSellButton()

  //Add grid card button functionalties
  $('.buy-minus').on('click', function () {
    let productName = $(this).data('product')
    let oldValue = cartData[productName].count

    let newValue = parseInt(oldValue) - 1
    if (newValue >= 0) {
      $(`.product-price-input[data-product="${productName}"]`).val(newValue)
      cartData[productName].count = parseInt(newValue)
      $('.details').html(genCartSell(cartData))
      setSellButton()
    }
  })

  $('.buy-plus').on('click', function () {
    let productName = $(this).data('product')
    let oldValue = cartData[productName].count

    let newValue = parseInt(oldValue) + 1

    if (newValue <= cartData[productName].inventoryCount) {
      if (!data.IsUnlimited) {
        if (
          newValue <=
          cartData[productName].max - cartData[productName].dbCount
        ) {
          $(`.product-price-input[data-product="${productName}"]`).val(newValue)
          cartData[productName].count = parseInt(newValue)
          $('.details').html(genCartSell(cartData))
          setSellButton()
        }
      } else {
        $(`.product-price-input[data-product="${productName}"]`).val(newValue)
        cartData[productName].count = parseInt(newValue)
        $('.details').html(genCartSell(cartData))
        setSellButton()
      }
    }
  })

  $('.product-price-input').on('input', function () {
    let productName = $(this).data('product')

    $(this).val(Math.round($(this).val()))

    if ($(this).val() > cartData[productName].inventoryCount) {
      if (
        data.IsUnlimited ||
        cartData[productName].inventoryCount <
          cartData[productName].max - cartData[productName].dbCount
      ) {
        $(this).val(cartData[productName].inventoryCount)
      } else {
        $(this).val(cartData[productName].max - cartData[productName].dbCount)
      }

      cartData[productName].count = parseInt($(this).val())
      $('.details').html(genCartSell(cartData))
      setSellButton()
      return
    }

    if (
      !data.IsUnlimited &&
      $(this).val() > cartData[productName].max - cartData[productName].dbCount
    ) {
      $(this).val(cartData[productName].max - cartData[productName].dbCount)
    }

    if ($(this).val() < 0) {
      $(this).val(0)
    }
    cartData[productName].count = parseInt($(this).val())
    $('.details').html(genCartSell(cartData))
    setSellButton()
  })
}

const setSellButton = () => {
  $('#pay-button').html(locale[lang].sellButton)
  $('#pay-button').unbind()
  $('#pay-button').on('click', function () {
    openModal(
      locale[lang].sellTitle,
      locale[lang].sellQuestion,
      function () {
        if (!sellButtonLocked) {
          sellButtonLocked = true
          let payData = Object.keys(cartData)
            .filter((key) => cartData[key].count > 0)
            .map((key) => ({
              name: key,
              amount: cartData[key].count,
              price: cartData[key].SPrice,
            }))
          if (payData.length) {
            $.post(
              `https://${GetParentResourceName()}/action`,
              JSON.stringify({
                action: 'sell',
                data: {
                  DisplayName: data.shopId,
                  PaymentID: data.PaymentID,
                  payData: payData,
                },
              })
            )
          } else {
            openModal(locale[lang].error, locale[lang].emptyCart)
          }
        }
      },
      closeModal,
      locale[lang].yes,
      locale[lang].cancel
    )
  })
}


const openModal = (
  title,
  content,
  onSubmit,
  onCancel = closeModal,
  okTitle = 'OK',
  cancelTitle = locale[lang].close
) => {
  $('.modal-wrapper').css('display', 'flex')
  $('.modal-title').html(title)
  $('.modal-content').html(content)
  $('.modal-ok').html(okTitle)
  $('.modal-cancel').html(cancelTitle)
  $('.modal-ok').unbind()
  $('.modal-cancel').unbind()
  if (onSubmit) {
    $('.modal-ok').css('display', 'flex')
    $('.modal-ok').on('click', onSubmit)
  } else {
    $('.modal-ok').css('display', 'none')
  }
  $('.modal-cancel').on('click', onCancel)
}

const closeModal = () => {
  $('.modal-wrapper').css('display', 'none')
}

