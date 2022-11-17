document.addEventListener("DOMContentLoaded", () => {
    var images = document.getElementsByTagName("img");
    for (var i = 0, n = images.length; i < n; ++i) {
        var el = images[i];
        el.id = `image${i}`;
        el.className = "myContent";
        var wrapper = document.createElement('div');
        wrapper.className = "embed-responsive-item myViewport";
        wrapper.id = `wrapper${i}`;
        wrapper.width = "auto";
        el.parentNode.insertBefore(wrapper, el);
        wrapper.appendChild(el);
    }
    var images = document.getElementsByTagName("img");
    for (var i = 0, n = images.length; i < n; ++i) {
        // var rangeElement = document.getElementById(`slidder${i}`);
        var wrapper = document.getElementById(`wrapper${i}`);
        var wzoom = WZoom.create(`#${images[i].id}`, {
            type: 'html',
            width: images[i].naturalWidth,
            height: images[i].naturalHeight,
            dragScrollableOptions: {
                onGrab: function () {
                    wrapper.style.cursor = 'grabbing';
                },
                onDrop: function () {
                    wrapper.style.cursor = 'grab';
                }
            }
        });
    }
    // (B) "SAVE AS"
    // var myFile = new File([document.documentElement.innerHTML], "demo.txt", {type: "text/plain;charset=utf-8"});
    // saveAs(myFile);
});
