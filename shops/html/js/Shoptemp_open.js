var buyMenu = `<div id="buymenu" class="menu-element">
             <i class="fa-solid fa-cash-register"></i>
              ${locale[lang].buyMenu}
            </div>`
var sellMenu = `<div id="sellmenu" class="menu-element">
             <i class="fa-regular fa-handshake"></i>
              ${locale[lang].sellMenu}
            </div>`
const genCard = (
              id,
              name,
              ItemLabel,
              count,
              MaxAmount,
              price,
              inventoryCount,
              type,
              IsUnlimited,
              accountType
            ) => {

                /// OX_inventory: <img src="nui://ox_inventory/web/images/${name}.png"
                /// QB-Inventory: <img src="nui://qb-inventory/html/images/${name}.png"

              const isBlackMoney = accountType == 3; // Check if the product is black money
              const tooltipText = isBlackMoney ? locale[lang].blackMoneyTooltip : '';
            
              // Generate buy/sell menus and cart with black money check
              const buyCartHTML = genCartBuy(cartData, isBlackMoney);
              const sellCartHTML = genCartSell(cartData, isBlackMoney);
              
              // Menu generation
              const buyMenuHTML = buyMenu;
              const sellMenuHTML = sellMenu;
            
              return `<div class="card-container">
                              <div class="card-background ${isBlackMoney ? 'blackmoney' : ''}">
                                <div class="product-image">
                                  <img src="nui://ox_inventory/web/images/${name}.png" 
                                       ${isBlackMoney ? `data-tooltip="${tooltipText}"` : ''} />
                                </div>
                                <div class="product-data">
                                  <div class="product-name ${isBlackMoney ? 'blackmoney' : ''}">${ItemLabel}</div>
                                  <div class="product-count">
                                    <div class="price-count-current">${!IsUnlimited ? count + locale[lang].countUnit : ''}</div>
                                    <div class="price-count-max">${!IsUnlimited ? locale[lang].maxName + MaxAmount : ''}</div>
                                  </div>
                                  <div class="product-price ${isBlackMoney ? 'blackmoney' : ''}">${price}${locale[lang].moneyUnit}</div>
                                  <div class="product-buy">
                                    <div class="buy-button buy-minus ${type === 'buy' ? (count === 0 && !IsUnlimited ? 'disabled' : '') : (inventoryCount === 0 || (count === MaxAmount && !IsUnlimited) ? 'disabled' : '')}" data-product="${name}" data-id="${id}">
                                      <i class="fa-solid fa-minus"></i>
                                    </div>
                                    <input class="product-price-input ${type === 'buy' ? (count === 0 && !IsUnlimited ? 'disabled' : '') : (inventoryCount === 0 || (count === MaxAmount && !IsUnlimited) ? 'disabled' : '')}" value="0" data-product="${name}" data-id="${id}" type="number" name="count" id="input-${name}" />
                                    <div class="buy-button buy-plus ${type === 'buy' ? (count === 0 && !IsUnlimited ? 'disabled' : '') : (inventoryCount === 0 || (count === MaxAmount && !IsUnlimited) ? 'disabled' : '')}" data-product="${name}" data-id="${id}">
                                      <i class="fa-solid fa-plus"></i>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>`;
            }
            
            

            const genCartBuy = (cartData, accountType) => {
              let list = `<div class="details-list-title">
                            ${locale[lang].cartTitle} <i class="fa-solid fa-basket-shopping" style="margin-left: 5px;"></i>
                          </div>`;
              let total = 0;
              const isBlackMoney = accountType === 3; // Check if the payment is black money
              
              for (const [key, _value] of Object.entries(cartData)) {
                if (cartData[key].count > 0) {
                  list += `<div class="details-list-product">
                              <div class="details-list-product-name">${cartData[key].count} x ${cartData[key].ItemLabel}</div>
                              <div class="details-list-product-price" style="margin-left: 5px;">${cartData[key].BPrice * cartData[key].count}${locale[lang].moneyUnit}</div>
                            </div>`;
                  total += cartData[key].BPrice * cartData[key].count;
                }
              }
            
              list += '</div>';
            
              return `<div class="details-list">
                            ${list}
                          <div class="details-action">
                            <div id="pay-button" class="${isBlackMoney ? 'black-money-button' : ''}">${locale[lang].buyButton}</div>
                          </div>
                          <div class="details-total" style="margin-top: 10px;">
                            <div class="details-totaltext">${locale[lang].total}:</div>
                            <div class="details-totalprice">${total}${locale[lang].moneyUnit}</div>
                          </div>
                          </div>`;
            }
            
            const genCartSell = (cartData, accountType) => {
              let list = `<div class="details-list-title">
                            ${locale[lang].sellListTitle} <i class="fa-solid fa-chart-line" style="margin-left: 5px;"></i>
                          </div>`;
              let total = 0;
              const isBlackMoney = accountType === 3; // Check if the payment is black money
            
              for (const [key, _value] of Object.entries(cartData)) {
                if (cartData[key].count > 0) {
                  list += `<div class="details-list-product">
                              <div class="details-list-product-name">${cartData[key].count} x ${cartData[key].ItemLabel}</div>
                              <div class="details-list-product-price" style="margin-left: 5px;">${cartData[key].SPrice * cartData[key].count}${locale[lang].moneyUnit}</div>
                            </div>`;
                  total += cartData[key].SPrice * cartData[key].count;
                }
              }
            
              list += '</div>';
            
              return `<div class="details-list">
                            ${list}
                          <div class="details-action">
                            <div id="pay-button" class="${isBlackMoney ? 'black-money-button' : ''}">${locale[lang].sellButton}</div>
                          </div>
                          <div class="details-total">
                            <div class="details-totaltext">${locale[lang].total}:</div>
                            <div class="details-totalprice">${total}${locale[lang].moneyUnit}</div>
                          </div>
                          </div>`;
            }
            




