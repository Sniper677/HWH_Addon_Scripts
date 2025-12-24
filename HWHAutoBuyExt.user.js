// ==UserScript==
// @name            HWHAutoBuyExt
// @name:en         HWHAutoBuyExt
// @name:ru         HWHAutoBuyExt
// @namespace       HWHAutoBuyExt
// @version         0.2.0.1
// @description     Extension for HeroWarsHelper script
// @description:en  Extension for HeroWarsHelper script
// @description:ru  Расширение для скрипта HeroWarsHelper
// @author          Bartjan, Rlogin44/fpoupeli, Sniper677
// @license         Copyright Sniper677
// @homepage        https://github.com/Sniper677/HWH_Addon_Scripts
// @icon            https://cdn0.iconfinder.com/data/icons/superheros-1/512/Superheroes-04-512.png
// @match           https://www.hero-wars.com/*
// @match           https://apps-1701433570146040.apps.fbsbx.com/*
// @run-at          document-start
// @downloadURL     https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/HWHAutoBuyExt.user.js
// @updateURL       https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/meta/HWHAutoBuyExt.meta.js
// ==/UserScript==

(function () {

    if (!this.HWHClasses || !this.HWHData || !this.HWHFuncs || !this.Caller) {
        console.log('%cObject for extension not found', 'color: red');
        return;
    }

    console.log('%cStart Extension ' + GM_info.script.name + ', v' + GM_info.script.version + ' by ' + GM_info.script.author, 'color: green');

    const { HWHClasses, HWHFuncs, HWHData, cheats, Caller } = this;
    const { addExtentionName, I18N, setProgress, hideProgress, popup, getSaveVal, setSaveVal } = HWHFuncs;

    addExtentionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);

    // ----- Text formating for console output -----
    const msglog_text = "";
    const msglog_prefix = "%c";
    const msglog_format = "color: cyan";

    // -------------------- Configuration model --------------------
    const settings = {
        coin1:          { input: null, default: true },  // Arena Coin
        coin2:          { input: null, default: true },  // Grand Arena Coin
        coin3:          { input: null, default: true },  // Tower Coin
        coin4:          { input: null, default: true },  // Outland Coin
        coin5:          { input: null, default: true },  // Soul Coin
        coin6:          { input: null, default: true },  // Friendship Coin
        maxGear:        { input: null, default: 3 },
        maxFragment:    { input: null, default: 80 },
        maxFragmentRed: { input: null, default: 200 },
        minCoins:       { input: null, default: 100000 },
        dryRun:         { input: null, default: false },
    };

    const COINS = [
        { id: '1', name: 'Arena Coin',        setting: 'coin1' },
        { id: '2', name: 'Grand Arena Coin',  setting: 'coin2' },
        { id: '3', name: 'Tower Coin',        setting: 'coin3' },
        { id: '4', name: 'Outland Coin',      setting: 'coin4' },
        { id: '5', name: 'Soul Coin',         setting: 'coin5' },
        { id: '6', name: 'Friendship Coin',   setting: 'coin6' },
    ];

    const ALLOWED_COIN_IDS = COINS.map((coin) => coin.id);
    const ALLOWED_REWARD_TYPES = ['gear', 'fragmentGear', 'fragmentScroll'];

    const SHOP_NAMES = {
        1: 'Town Shop',
        4: 'Arena Shop',
        5: 'Grand Arena Shop',
        6: 'Tower Shop',
        8: 'Soul Shop',
        9: 'Friendship Shop',
        10: 'Outland Shop',
        11: 'Guild War Shop',
        13: 'Elemental Tournament Shop => Titan Artifacts',
        14: 'Elemental Tournament Shop => Certificate Exchange',
        17: 'Pet Soul Stone Shop',
        1632000026: 'Secret Wealth',
    };

    const { buttons, i18nLangData } = HWHData;

    const i18nLangDataEn = {
        ABE_BTN: 'Auto Buy Items',
        ABE_BTN_TITLE: 'Automatically buys allowed items based on your settings.',
        ABE_BTN_SETTINGS:
          `<span style="color: white;">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" style="width: 22px;height: 22px;"><path d="M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"></path></svg>
          </span>`,
        ABE_BTN_SETTINGS_LEGACY: '<span style="color: white; font-size: 28px;">⚙</span>',
        ABE_BTN_SETTINGS_TITLE: 'Change settings for HWHAutoBuyExt',
        NO_ITEMS_TO_BUY: 'No items to buy based on current settings.',
    };
    i18nLangData['en'] = Object.assign(i18nLangData['en'], i18nLangDataEn);

    // Run button
    const HWHAutoBuyExtButton = {
        HWHAutoBuyExtButton: {
            isCombine: true,
            combineList: [
                {
                    get name()  { return I18N('ABE_BTN') },
                    get title() { return I18N('ABE_BTN_TITLE') },
                    onClick: autoBuyFromShops,
                    hide: false,
                    color: 'green',
                },
                {
                    get name() {
                        if (compareVersions(scriptInfo.version, '2.400') >= 0) {
                            return I18N('ABE_BTN_SETTINGS');
                        }
                        return I18N('ABE_BTN_SETTINGS_LEGACY');
                    },
                    get title() { return I18N('ABE_BTN_SETTINGS_TITLE') },
                    onClick: autoBuyConfig,
                    hide: false,
                    color: 'green',
                },
            ]
        }
    };

    Object.assign(buttons, HWHAutoBuyExtButton)
    this.HWHData.buttons = buttons;

    // -------------------- Helper: compare script versions --------------------
    function compareVersions(version1, version2) {
        const v1 = version1.split('.').map(Number);
        const v2 = version2.split('.').map(Number);

        const maxLength = Math.max(v1.length, v2.length);

        for (let i = 0; i < maxLength; i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;

            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }

        return 0;
    }

    // -------------------- Helper: translate reward to name --------------------
    function getItemName(rewardType, rewardData) {
        try {
            const itemId = Object.keys(rewardData)[0];

            // Build translation key (LIB_* names used by HWH/cheats)
            let libType = rewardType.charAt(0).toUpperCase() + rewardType.slice(1);
            if (rewardType.startsWith('fragment')) {
                const base = rewardType.replace('fragment', '');
                libType = base.charAt(0).toUpperCase() + base.slice(1);
            }

            const libName = `LIB_${libType.toUpperCase()}_NAME_${itemId}`;
            const translated = cheats.translate(libName);
            return translated.startsWith('LIB_') ? `${rewardType} ${itemId}` : translated;
        } catch (e) {
            return `${rewardType} ID`;
        }
    }

    // -------------------- Auto-buy core --------------------
    async function autoBuyFromShops() {
        console.log(msglog_prefix + '#----------------------------------------', msglog_format);
        console.log(msglog_prefix + '# ' + GM_info.script.name + ' by ' + GM_info.script.author, msglog_format);
        console.log(msglog_prefix + '#----------------------------------------', msglog_format);
        console.log(msglog_prefix + '=== ' + GM_info.script.name + ' START ===', msglog_format);
        setProgress('Starting ' + GM_info.script.name + '...');

        // Read configuration from storage so we don't depend on inputs being present
        const maxGear        = getSaveVal('HWHAutoBuyExt_maxGear',        settings.maxGear.default);
        const maxFragment    = getSaveVal('HWHAutoBuyExt_maxFragment',    settings.maxFragment.default);
        const maxFragmentRed = getSaveVal('HWHAutoBuyExt_maxFragmentRed', settings.maxFragmentRed.default);
        const minCoins       = getSaveVal('HWHAutoBuyExt_minCoins',       settings.minCoins.default);
        const dryRun         = getSaveVal('HWHAutoBuyExt_dryRun',         settings.dryRun.default);

        const enabledCoins = {};
        COINS.forEach((coin) => {
            enabledCoins[coin.id] = getSaveVal(`HWHAutoBuyExt_${coin.setting}`, settings[coin.setting].default);
        });

        // Fetch server data
        const [shops, inventory, userInfo] = await Caller.send(['shopGetAll', 'inventoryGet', 'userGetInfo']);
        const currencyTracker = { ...inventory.coin, gold: userInfo.gold };

        const callsToMake = [];
        const itemsToLog = [];
        const itemsToBar = [];

        for (const shopId in shops) {
            if (parseInt(shopId, 10) >= 11) continue;
            const currentShop = shops[shopId];
            if (!currentShop.slots) continue;

            for (const slotId in currentShop.slots) {
                const slot = currentShop.slots[slotId];
                let shouldBuy = true;

                // Basic checks
                if (slot.bought || !slot.reward || !slot.cost) shouldBuy = false;

                // Cost checks
                if (shouldBuy) {
                    const costType = Object.keys(slot.cost)[0];
                    const costCurrencyId = Object.keys(slot.cost[costType])[0];

                    if (costType !== 'coin' || !ALLOWED_COIN_IDS.includes(costCurrencyId) || !enabledCoins[costCurrencyId]) {
                        shouldBuy = false;
                    }

                    if (shouldBuy) {
                        const costAmount = slot.cost[costType][costCurrencyId];
                        const playerBalance = currencyTracker[costCurrencyId] ?? 0;
                        if (playerBalance < costAmount + minCoins) {
                            shouldBuy = false;
                        }
                    }
                }

                // Reward checks
                if (shouldBuy) {
                    for (const [rewardType, rewardData] of Object.entries(slot.reward)) {
                        if (!ALLOWED_REWARD_TYPES.includes(rewardType)) { shouldBuy = false; break; }

                        const itemId = Object.keys(rewardData)[0];
                        const inventoryCount = (inventory[rewardType] && inventory[rewardType][itemId]) ? inventory[rewardType][itemId] : 0;

                        // Max caps
                        let maxFragmentToCheck = maxFragment;
                        if (5 == Object.values(rewardData)[0]) {
                            maxFragmentToCheck = maxFragmentRed;
                        }
                        //if ((rewardType === 'gear' /* || rewardType === 'scroll' if present */) && inventoryCount >= maxGear) { shouldBuy = false; break; }
                        if ((rewardType === 'gear' || rewardType === 'scroll') && inventoryCount >= maxGear) { shouldBuy = false; break; }
                        if ((rewardType === 'fragmentGear' || rewardType === 'fragmentScroll') && inventoryCount >= maxFragmentToCheck) { shouldBuy = false; break; }
                    }
                }

                // Queue buy
                if (shouldBuy) {
                    callsToMake.push({
                        name: 'shopBuy',
                        args: { shopId: currentShop.id, slot: slot.id, cost: slot.cost, reward: slot.reward },
                        ident: `shopBuy_${currentShop.id}_${slot.id}`,
                    });

                    const rewardType = Object.keys(slot.reward)[0];
                    const rewardData = slot.reward[rewardType];
                    const amount = Object.values(rewardData)[0];
                    const itemId = Object.keys(rewardData)[0];

                    itemsToLog.push(`• ${SHOP_NAMES[shopId] ?? `Shop ${shopId}`}: ${getItemName(rewardType, rewardData)} (x${amount})`);
                    itemsToBar.push(`• ${SHOP_NAMES[shopId] ?? `Shop ${shopId}`}: <span style="color: white;">${getItemName(rewardType, rewardData)}</span> (<span style="color: cyan;">x${amount}</span>)`);

                    const costType = Object.keys(slot.cost)[0];
                    const costCurrencyId = Object.keys(slot.cost[costType])[0];
                    const costAmount = slot.cost[costType][costCurrencyId];
                    currencyTracker[costCurrencyId] -= costAmount;
                    if (inventory[rewardType] && inventory[rewardType][itemId]) {
                        inventory[rewardType][itemId] += amount;
                    }
                }
            }
        }

        // Execute queued buys
        if (callsToMake.length > 0) {
            console.log(`Attempting to buy ${callsToMake.length} items...`);
            setProgress(`Buying ${callsToMake.length} items...`);

            const boughtStringLog = itemsToLog.join('\n');
            const boughtStringBar = itemsToBar.join('<br>');
            let setProgressMessage = `${GM_info.script.name} `;

            if (dryRun) { setProgressMessage += `[ <span style="color: orange;">Dry Run</span> ] ` }
            setProgressMessage += `: <span style="color: green;">${itemsToBar.length}</span> items `;
            if (dryRun) { setProgressMessage += `would be ` }
            setProgressMessage += `bought<br>`;
            setProgressMessage += `<span style="font-size: 15px;">${boughtStringBar}</span>`;

            if (dryRun) {
                console.log('%c--- Dry Run Mode ENABLED: No purchases will be made. ---', 'color: orange; font-weight: bold;');
                console.log(boughtStringLog);
                setProgress(setProgressMessage, 10000, hideProgress);
            } else {
                try {
                    const buyResult = await Caller.send(callsToMake);
                    if (buyResult) {
                        console.log('%c--- Items bought successfully ---', 'color: lightgreen; font-weight: bold;');
                        console.log(boughtStringLog);
                        setProgress(setProgressMessage, 10000, hideProgress);
                    } else {
                        throw new Error("Buy command failed to return a result.");
                    }
                } catch (error) {
                    console.error('An error occurred during purchase:', error);
                    setProgress('Error during purchase. Check console.', true);
                }
            }
        } else {
            console.log(I18N('NO_ITEMS_TO_BUY'));
            setProgress(I18N('NO_ITEMS_TO_BUY'), true);
        }
        console.log(msglog_prefix + '=== ' + GM_info.script.name + ' END ===', msglog_format);
    }

    // -------------------- Controls builder (side-by-side layout) --------------------
    function autoBuyControls(targetEl) {
        // 1. Create Layout Container (Flexbox)
        const mainLayout = document.createElement('div');
        mainLayout.style.cssText = 'display:flex; gap:16px; align-items:stretch; font-size:14px;';

        // 2. Create Left Column (Checkboxes)
        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'flex:1; display:flex; flex-direction:column;';

        // 3. Create Vertical Divider
        const divider = document.createElement('div');
        divider.style.cssText = 'width:1px; background:#444; margin:0 8px;';

        // 4. Create Right Column (Numeric Inputs)
        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'flex:1; display:flex; flex-direction:column;';

        // Helper: create checkbox (modified to accept target column)
        const createCheckbox = (label, tooltip, key, column) => {
            const wrap = document.createElement('label');
            wrap.style.cssText = 'display:flex; align-items:center; gap:8px; margin:4px 0; cursor:pointer; font-size:14px;';
            wrap.title = tooltip;

            const input = document.createElement('input');
            input.type = 'checkbox';

            const text = document.createElement('span');
            text.textContent = label;
            text.style.fontSize = '14px';

            wrap.append(input, text);
            column.appendChild(wrap);

            const savedValue = getSaveVal(`HWHAutoBuyExt_${key}`, settings[key].default);
            input.checked = !!savedValue;
            input.addEventListener('change', (e) => setSaveVal(`HWHAutoBuyExt_${key}`, e.target.checked));

            settings[key].input = input;
            return input;
        };

        // Helper: create numeric input (modified to accept target column)
        const createNumberInput = (label, placeholder, key, column) => {
            const wrap = document.createElement('label');
            wrap.style.cssText = 'display:flex; flex-direction:column; gap:4px; margin:6px 0; font-size:14px;';

            const cap = document.createElement('span');
            cap.textContent = label;
            cap.style.fontSize = '12px';
            cap.style.color = '#ccc';

            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = placeholder;
            input.style.cssText = 'padding:6px; border-radius:4px; border:1px solid #444; background:#2b2b2b; color:#fff; font-size:14px;';
            input.onfocus = () => input.style.borderColor = '#666';
            input.onblur = () => input.style.borderColor = '#444';

            wrap.append(cap, input);
            column.appendChild(wrap);

            const savedValue = getSaveVal(`HWHAutoBuyExt_${key}`, settings[key].default);
            input.value = savedValue;
            input.addEventListener('input', (e) => {
                const v = parseInt(e.target.value, 10);
                setSaveVal(`HWHAutoBuyExt_${key}`, Number.isFinite(v) ? v : settings[key].default);
            });

            settings[key].input = input;
            return input;
        };

        // --- Fill Left Column (Coins) ---
        COINS.forEach(coin => {
            createCheckbox(
                `Buy with ${coin.name}`,
                `Allows buying items using ${coin.name}`,
                coin.setting,
                leftCol
            );
        });

        // --- Fill Right Column (Numeric Fields) ---
        createNumberInput('Max Gear/Scroll Count:',  'e.g., 3', 'maxGear', rightCol);
        createNumberInput('Max Fragment Count:',     'e.g., 80', 'maxFragment', rightCol);
        createNumberInput('Max Fragment Red Count:', 'e.g., 200', 'maxFragmentRed', rightCol);
        createNumberInput('Min Coin Reserve:',       'e.g., 100000', 'minCoins', rightCol);

        // Assemble everything into the target element
        mainLayout.append(leftCol, divider, rightCol);
        targetEl.appendChild(mainLayout);
    }

    // -------------------- Popup (modal) for configuration --------------------
    function autoBuyConfig() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'autoBuyConfigOverlay';
        overlay.style.cssText = `
          position:fixed; inset:0; z-index:9999;
          background:rgba(0,0,0,0.55);
          display:flex; align-items:center; justify-content:center;
        `;

        // Modal panel
        const modal = document.createElement('div');
        modal.style.cssText = `
          background:#1e1e1e; color:#fff; border-radius:12px; border:1px solid #ffffff;
          min-width:640px; max-width:90vw; max-height:90vh; overflow:auto;
          box-shadow:0 12px 40px rgba(0,0,0,0.4);
          padding:16px; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; font-size:14px;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;';
        const title = document.createElement('h3');
        title.textContent = 'Settings for HWHAutoBuyExt';
        title.style.margin = '0';
        title.style.fontSize = '18px';
        const btnClose = document.createElement('button');
        btnClose.textContent = 'x';
        btnClose.style.cssText = 'padding:6px 10px; border-radius:8px; border:1px solid #555; background:#2b2b2b; color:#fff; cursor:pointer; font-size:14px;';
        btnClose.onclick = () => document.body.removeChild(overlay);
        header.append(title, btnClose);

        // Content
        const content = document.createElement('div');
        content.style.cssText = 'margin:12px 0; font-size:14px;';
        autoBuyControls(content); // Build controls inside the popup

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:14px;';

        // Footer left side: Dry Run Checkbox
        const leftWrap = document.createElement('div');
        leftWrap.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const dryRunLabel = document.createElement('label');
        dryRunLabel.style.cssText = 'display:flex; align-items:center; gap:8px; cursor:pointer; font-size:14px;';
        dryRunLabel.title = 'Simulate purchases without spending anything';

        const dryRunInput = document.createElement('input');
        dryRunInput.type = 'checkbox';
        dryRunInput.checked = !!getSaveVal('HWHAutoBuyExt_dryRun', settings.dryRun.default);
        dryRunInput.addEventListener('change', (e) => setSaveVal('HWHAutoBuyExt_dryRun', e.target.checked));

        const dryRunText = document.createElement('span');
        dryRunText.textContent = 'Dry Run Mode';
        dryRunText.style.fontSize = '14px';
        dryRunLabel.append(dryRunInput, dryRunText);
        leftWrap.append(dryRunLabel);

        // Footer right side: Reset + Run buttons
        const rightWrap = document.createElement('div');
        rightWrap.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const btnReset = document.createElement('button');
        btnReset.textContent = 'Reset to Defaults';
        btnReset.style.cssText = 'padding:8px 14px; border-radius:8px; border:0; background:#444; color:#fff; cursor:pointer; font-size:14px;';
        btnReset.onclick = () => {
            // Reset all saved settings to defaults and update UI if present
            Object.keys(settings).forEach((key) => {
                setSaveVal(`HWHAutoBuyExt_${key}`, settings[key].default);
                if (settings[key].input) {
                    if (settings[key].input.type === 'checkbox') {
                        settings[key].input.checked = !!settings[key].default;
                    } else {
                        settings[key].input.value = settings[key].default;
                    }
                }
            });
            // Also update the footer Dry Run checkbox
            dryRunInput.checked = !!settings.dryRun.default;
        };

        const btnRun = document.createElement('button');
        btnRun.textContent = 'Run Now';
        btnRun.style.cssText = 'padding:8px 14px; border-radius:8px; border:0; background:#1a7f37; color:#fff; cursor:pointer; font-size:14px;';
        btnRun.onclick = async () => { await autoBuyFromShops(); document.body.removeChild(overlay); };
        rightWrap.append(btnReset, btnRun);
        footer.append(leftWrap, rightWrap);

        // Assemble and show
        modal.append(header, content, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
})();