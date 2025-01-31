function CustomCubPlugin() {
    const PLUGIN_ID = 'custom-cub-proxy';
    let customCubUrl = localStorage.getItem('customCubUrl') || 'https://cub.red';

    function modifyRequests() {
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
            if (typeof input === 'string' && input.includes('cub.red')) {
                input = input.replace('cub.red', new URL(customCubUrl).host);
            }
            return originalFetch(input, init);
        };
    }

    function createSettingsMenu() {
        let html = `
            <div class="custom-cub-settings">
                <div class="settings-title">Custom Cub URL</div>
                <input type="text" id="cub-url" value="${customCubUrl}" placeholder="Enter your custom Cub URL">
                <button id="save-cub-url">Save</button>
            </div>
        `;
        let menu = document.createElement('div');
        menu.innerHTML = html;
        menu.classList.add('settings-container');
        document.body.appendChild(menu);

        document.getElementById('save-cub-url').addEventListener('click', function () {
            let newUrl = document.getElementById('cub-url').value.trim();
            if (newUrl) {
                localStorage.setItem('customCubUrl', newUrl);
                customCubUrl = newUrl;
                alert('Custom Cub URL saved! Restart Lampa for changes to take effect.');
            }
        });
    }

    Plugins.add({
        id: PLUGIN_ID,
        title: 'Custom Cub Proxy',
        version: '1.0.0',
        description: 'Allows setting a custom Cub URL instead of default cub.red.',
        onload: function () {
            modifyRequests();
            createSettingsMenu();
        },
        onremove: function () {
            window.fetch = originalFetch;
        }
    });
}

CustomCubPlugin();
