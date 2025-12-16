// ==UserScript==
// @name            HWHAutoBuyExt
// @name:en         HWHAutoBuyExt
// @name:ru         HWHAutoBuyExt
// @namespace       HWHAutoBuyExt
// @version         0.1.1
// @description     Extension for HeroWarsHelper script
// @description:en  Extension for HeroWarsHelper script
// @description:ru  Расширение для скрипта HeroWarsHelper
// @author          Sniper677
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
    const { addExtentionName, I18N, setProgress, popup, getSaveVal, setSaveVal } = HWHFuncs;

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

    const { buttons } = HWHData;

    // Run button
    const HWHAutoBuyExtButton = {
        HWHAutoBuyExtButton: {
            isCombine: true,
            combineList: [
                {
                    get name()  { return 'Auto Buy Items'; },
                    get title() { return 'Automatically buys allowed items from shops with ID < 11 based on your settings.'; },
                    onClick: autoBuyFromShops,
                    hide: false,
                    color: 'green',
                },
                {
                    get name()  { return '<span style="color: white; font-size: 28px;">⚙</span>'; },
                    get title() { return 'Open a popup with Auto Buy settings (checkboxes & inputs).'; },
                    onClick: autoBuyConfig,
                    hide: false,
                    color: 'green',
                },
            ]
        }
    };

    Object.assign(buttons, HWHAutoBuyExtButton)
    this.HWHData.buttons = buttons;

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

            if (dryRun) {
                console.log('%c--- Dry Run Mode ENABLED: No purchases will be made. ---', 'color: orange; font-weight: bold;');
                const boughtStringLog = itemsToLog.join('\n');
                const boughtStringBar = itemsToLog.join('<br>');
                console.log(boughtStringLog);
                setProgress(GM_info.script.name + ` (Dry Run): ${itemsToLog.length} items would be bought<br>${boughtStringBar}`, 10000, true);
            } else {
                try {
                    const buyResult = await Caller.send(callsToMake);
                    if (buyResult) {
                        const boughtStringLog = itemsToLog.join('\n');
                        const boughtStringBar = itemsToLog.join('<br>');
                        console.log('%c--- Items bought successfully ---', 'color: lightgreen; font-weight: bold;');
                        console.log(boughtStringLog);
                        setProgress(GM_info.script.name + `: ${itemsToLog.length} items bought<br>${boughtStringBar}`, 10000, true);
                    } else {
                        throw new Error("Buy command failed to return a result.");
                    }
                } catch (error) {
                    console.error('An error occurred during purchase:', error);
                    setProgress('Error during purchase. Check console.', true);
                }
            }
        } else {
            console.log('No items to buy based on current settings.');
            setProgress('No items to buy based on current settings.', true);
        }
        console.log(msglog_prefix + '=== ' + GM_info.script.name + ' END ===', msglog_format);
    }

    // -------------------- Controls builder (popup-only; no ScriptMenu needed) --------------------
    function autoBuyControls(targetEl) {
        // Helper: create checkbox
        const createCheckbox = (label, tooltip, key) => {
            const wrap = document.createElement('label');
            wrap.style.cssText = 'display:flex; align-items:center; gap:8px; margin:4px 0;';
            wrap.title = tooltip;

            const input = document.createElement('input');
            input.type = 'checkbox';

            const text = document.createElement('span');
            text.textContent = label;

            wrap.append(input, text);
            targetEl.appendChild(wrap);

            const savedValue = getSaveVal(`HWHAutoBuyExt_${key}`, settings[key].default);
            input.checked = !!savedValue;
            input.addEventListener('change', (e) => setSaveVal(`HWHAutoBuyExt_${key}`, e.target.checked));

            settings[key].input = input;
            return input;
        };

        // Helper: create numeric input
        const createNumberInput = (label, placeholder, key) => {
            const wrap = document.createElement('label');
            wrap.style.cssText = 'display:flex; flex-direction:column; gap:4px; margin:6px 0;';

            const cap = document.createElement('span');
            cap.textContent = label;

            const input = document.createElement('input');
            input.type = 'number';
            input.placeholder = placeholder;

            wrap.append(cap, input);
            targetEl.appendChild(wrap);

            const savedValue = getSaveVal(`HWHAutoBuyExt_${key}`, settings[key].default);
            input.value = savedValue;
            input.addEventListener('input', (e) => {
            const v = parseInt(e.target.value, 10);
            setSaveVal(`HWHAutoBuyExt_${key}`, Number.isFinite(v) ? v : settings[key].default);
            });

            settings[key].input = input;
            return input;
        };

        // Coins
        COINS.forEach(coin => {
            createCheckbox(
            `Enable buying with ${coin.name}`,
            `Allows buying items using ${coin.name}`,
            coin.setting
            );
        });

        // Numeric fields
        createNumberInput('Max Gear/Scroll Count:',  'e.g., 3', 'maxGear');
        createNumberInput('Max Fragment Count:',     'e.g., 80', 'maxFragment');
        createNumberInput('Max Fragment Red Count:', 'e.g., 200', 'maxFragmentRed');
        createNumberInput('Min Coin Reserve:',       'e.g., 100000', 'minCoins');
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
          background:#1e1e1e; color:#fff; border-radius:12px;
          min-width:560px; max-width:90vw; max-height:85vh; overflow:auto;
          box-shadow:0 12px 40px rgba(0,0,0,0.4);
          padding:16px; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;';
        const title = document.createElement('h3');
        title.textContent = 'Auto Buy Settings';
        title.style.margin = '0';
        const btnClose = document.createElement('button');
        btnClose.textContent = 'Close';
        btnClose.style.cssText = 'padding:6px 10px; border-radius:8px; border:1px solid #555; background:#2b2b2b; color:#fff; cursor:pointer;';
        btnClose.onclick = () => document.body.removeChild(overlay);
        header.append(title, btnClose);

        // Content
        const content = document.createElement('div');
        content.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:12px;';
        autoBuyControls(content); // Build controls inside the popup

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; margin-top:14px;';

        // Footer left side: Dry Run Checkbox
        const leftWrap = document.createElement('div');
        leftWrap.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const dryRunLabel = document.createElement('label');
        dryRunLabel.style.cssText = 'display:flex; align-items:center; gap:8px;';
        dryRunLabel.title = 'Simulate purchases without spending coins';

        const dryRunInput = document.createElement('input');
        dryRunInput.type = 'checkbox';
        dryRunInput.checked = !!getSaveVal('HWHAutoBuyExt_dryRun', settings.dryRun.default);
        dryRunInput.addEventListener('change', (e) => setSaveVal('HWHAutoBuyExt_dryRun', e.target.checked));

        const dryRunText = document.createElement('span');
        dryRunText.textContent = 'Dry Run Mode';
        dryRunLabel.append(dryRunInput, dryRunText);
        leftWrap.append(dryRunLabel);

        // Footer right side: Reset + Run buttons
        const rightWrap = document.createElement('div');
        rightWrap.style.cssText = 'display:flex; align-items:center; gap:8px;';

        const btnReset = document.createElement('button');
        btnReset.textContent = 'Reset to Defaults';
        btnReset.style.cssText = 'padding:8px 14px; border-radius:8px; border:0; background:#444; color:#fff; cursor:pointer;';
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
        btnRun.textContent = 'Run Auto‑Buy Now';
        btnRun.style.cssText = 'padding:8px 14px; border-radius:8px; border:0; background:#1a7f37; color:#fff; cursor:pointer;';
        btnRun.onclick = async () => { await autoBuyFromShops(); document.body.removeChild(overlay); };
        rightWrap.append(btnReset, btnRun);
        footer.append(leftWrap, rightWrap);

        // Assemble and show
        modal.append(header, content, footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }
})();