Number.prototype.modulo = function(n) {
    var m = (( this % n) + n) % n;
    return m < 0 ? m + Math.abs(n) : m;
};

function hexdec(hex) {
    hex = (hex + '').replace(/[^a-f0-9]/gi, '');
    return parseInt(hex, 16);
}

function substr_replace(str, replace, start, length) {
    if (start < 0) {
        start = start + str.length;
    }
    length = length !== undefined ? length : str.length;
    if (length < 0) {
        length = length + str.length - start;
    }
    return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
}

function value(key) {
    return document.querySelector('[name='+key+']').value;
}

function option(key) {
    return + document.querySelector('[name='+key+']').checked;
}

function selectResult() {
    var wrapper = document.querySelector('#wrapper');
    if ('createRange' in document && 'getSelection' in window) {
        var range= document.createRange();
        range.selectNodeContents(wrapper);
        var selection= window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } else if ('createTextRange' in wrapper) {
        wrapper.createTextRange().select();
    }
}

function generate() {
    var hash = CryptoJS.SHA256(value('public_key') + value('private_key') + value('length')).toString(),
        charsets = {},
        index = 0,
        pass = '',
        reserved = 0;

    if (option('lowercases')) {
        reserved++;
        charsets['lowercases'] = 'tdnbeisrvmlawgfckxyhjzpuqo';
    }
    if (option('uppercases')) {
        reserved++;
        charsets['uppercases'] = 'FWRTIEBAVUCMGZOXDKHNJYPQSL';
    }
    if (option('digits')) {
        reserved++;
        charsets['digits'] = '3876415290';
    }
    if (option('symbols')) {
        reserved++;
        charsets['symbols'] = '*],=}~&|>+%/.@$_?<:[!){^;#(';
    }

    if (reserved == 0) {
        return false;
    }

    for (var prog = 0; prog < value('length') - reserved; prog++) {
        charset = charsets[Object.keys(charsets)[hexdec(hash[index++]).modulo(Object.keys(charsets).length)]];
        character = charset[hexdec(hash[index++]).modulo(charset.length)];
        pass += character;
    }

    if (option('lowercases')) {
        var position = hexdec(hash[index++]).modulo(pass.length + 1);
        character = charsets.lowercases[hexdec(hash[index++]).modulo(charsets.lowercases.length)];
        pass = substr_replace(pass, character, position, 0);
    }
    if (option('uppercases')) {
        var position = hexdec(hash[index++]).modulo(pass.length + 1);
        character = charsets.uppercases[hexdec(hash[index++]).modulo(charsets.uppercases.length)];
        pass = substr_replace(pass, character, position, 0);
    }
    if (option('digits')) {
        var position = hexdec(hash[index++]).modulo(pass.length + 1);
        character = charsets.digits[hexdec(hash[index++]).modulo(charsets.digits.length)];
        pass = substr_replace(pass, character, position, 0);
    }
    if (option('symbols')) {
        var position = hexdec(hash[index++]).modulo(pass.length + 1);
        character = charsets.symbols[hexdec(hash[index++]).modulo(charsets.symbols.length)];
        pass = substr_replace(pass, character, position, 0);
    }

    document.querySelector('#wrapper').innerHTML = '<p>'+ pass + '</p>';
    document.querySelector('#wrapper').style.fontFamily = 'Verdana, sans-serif';
    document.body.onclick = selectResult;
    document.body.onkeydown = selectResult;
}

function init() {
    var publicKey = document.querySelector('#public_key');
    var savePreset = document.querySelector('#save_preset');

    publicKey.addEventListener('keyup', function(event) {
        savePreset.classList.remove('valid');
        savePreset.disabled = value('public_key') == '';
        savePreset.innerHtml = 'Save preset';
        chrome.storage.sync.get(['nikagi_presets'], function(presets) {
            presets = presets.nikagi_presets;
            if (preset = presets[value('public_key')]) {
                document.querySelector('[name=length]').value = preset.length;
                document.querySelector('[name=lowercases]').checked = preset.lowercases;
                document.querySelector('[name=uppercases]').checked = preset.uppercases;
                document.querySelector('[name=digits]').checked = preset.digits;
                document.querySelector('[name=symbols]').checked = preset.symbols;
            }
        });
    });

    savePreset.addEventListener('click', function(event) {
        event.preventDefault();
        event.returnValue = false;
        chrome.storage.sync.get(['nikagi_presets'], function(presets) {
            presets = presets.nikagi_presets;
            presets[value('public_key')] = {
                length: value('length'),
                lowercases: option('lowercases'),
                uppercases: option('uppercases'),
                digits: option('digits'),
                symbols: option('symbols')
            };
            chrome.storage.sync.set({ nikagi_presets: presets }, function() {
                savePreset.classList.add('valid');
                savePreset.innerHTML = 'Preset saved';
                publicKey.focus();
            });
        });
    });

    var form = document.querySelector('#form');
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.returnValue = false;
        return generate();
    });
}

if (document.readyState != 'loading') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}

