(function () {
  let selectedImage = null;
  let selectedClothing = null;
  let savedItems = [];
  let clothingOverlay = null;

  const currentScript = document.currentScript;

  const brandName = currentScript?.dataset.brandName || "Brand";
  const widgetTitle = currentScript?.dataset.widgetTitle || "Virtual Try-On";
  const primaryColor = currentScript?.dataset.primaryColor || "#111";
  const launcherText = currentScript?.dataset.launcherText || "Try-On Closet";

  const ANALYTICS_KEY = "tryon_widget_analytics";

  function getAnalytics() {
    const saved = localStorage.getItem(ANALYTICS_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          closet_opens: 0,
          try_on_clicks: 0,
          save_for_later_clicks: 0,
          photo_uploads: 0,
          camera_opens: 0,
          photos_taken: 0,
          previews_generated: 0,
          looks_saved: 0,
          selected_items_removed: 0,
          saved_items_removed: 0,
          events: [],
        };
  }

  function trackEvent(eventName, data = {}) {
    const analytics = getAnalytics();

    if (analytics[eventName] !== undefined) {
      analytics[eventName] += 1;
    }

    analytics.events.push({
      event: eventName,
      brand: brandName,
      data,
      time: new Date().toISOString(),
    });

    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));

    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: eventName,
        brand: brandName,
        data,
      }),
    }).catch(() => {});

    console.log("TRY-ON ANALYTICS:", eventName, data);
  }

  window.TryOnAnalytics = {
    getStats: getAnalytics,
    clearStats: function () {
      localStorage.removeItem(ANALYTICS_KEY);
      console.log("Try-on analytics cleared.");
    },
  };

  const launcher = document.createElement("button");
  launcher.innerText = `${launcherText} (0)`;

  Object.assign(launcher.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "14px 22px",
    borderRadius: "999px",
    border: "none",
    background: primaryColor,
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    zIndex: "999999",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  });

  const popup = document.createElement("div");
  Object.assign(popup.style, {
    display: "none",
    position: "fixed",
    bottom: "82px",
    right: "20px",
    width: "410px",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
    padding: "22px",
    zIndex: "999999",
    fontFamily: "Arial, sans-serif",
    color: "#111",
  });

  popup.innerHTML = `
    <div style="margin-bottom:14px;">
      <h2 style="margin:0;font-size:22px;">${widgetTitle}</h2>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">${brandName} try-on preview before checkout.</p>
    </div>

    <div id="selectedItemBox" style="display:none;margin-bottom:16px;padding:12px;border:1px solid #e5e5e5;border-radius:16px;position:relative;background:#fafafa;">
      <button id="removeItemBtn" style="position:absolute;top:8px;right:8px;border:none;background:#eee;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:14px;line-height:24px;padding:0;text-align:center;">×</button>
      <p style="margin:0 0 10px 0;font-size:12px;color:#777;text-transform:uppercase;letter-spacing:.05em;">Selected item</p>
      <div style="display:flex;gap:12px;align-items:center;">
        <img id="selectedItemImage" style="width:74px;height:74px;object-fit:cover;border-radius:12px;background:#eee;" />
        <div>
          <p id="selectedItemName" style="margin:0;font-weight:700;"></p>
          <p style="margin:4px 0 0;color:#777;font-size:13px;">Ready for preview</p>
        </div>
      </div>
    </div>

    <div id="savedBox" style="display:none;margin-bottom:16px;">
      <p style="font-weight:700;margin:0 0 10px 0;">Saved for later</p>
      <div id="savedList" style="display:flex;gap:10px;flex-wrap:wrap;"></div>
    </div>

    <div style="padding:14px;border:1px solid #e8e8e8;border-radius:16px;margin-bottom:16px;">
      <p style="margin:0 0 10px 0;font-weight:700;">Add your photo</p>
      <input id="fileInput" type="file" accept="image/*" style="width:100%;" />

      <button id="cameraBtn" style="margin-top:10px;width:100%;padding:11px;border:none;border-radius:12px;background:#f1f1f1;color:#111;cursor:pointer;font-weight:600;">
        Use Camera
      </button>

      <div style="position:relative;margin-top:10px;">
        <video id="video" autoplay style="display:none;width:100%;border-radius:14px;"></video>
        <div id="countdownOverlay" style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;font-size:96px;font-weight:bold;color:rgba(255,255,255,0.78);background:rgba(0,0,0,0.16);border-radius:14px;pointer-events:none;">3</div>
      </div>

      <button id="captureBtn" style="display:none;margin-top:10px;width:100%;padding:11px;border:none;border-radius:12px;background:${primaryColor};color:white;cursor:pointer;font-weight:600;">Take Photo</button>
      <button id="timerBtn" style="display:none;margin-top:8px;width:100%;padding:11px;border:none;border-radius:12px;background:#f1f1f1;color:#111;cursor:pointer;font-weight:600;">Take Photo in 3 Seconds</button>

      <canvas id="canvas" style="display:none;"></canvas>
    </div>

    <button id="generateBtn" style="width:100%;padding:13px;border:none;border-radius:14px;background:${primaryColor};color:white;font-size:16px;font-weight:700;cursor:pointer;">
      Generate Try-On Preview
    </button>

    <div id="resultBox" style="display:none;margin-top:16px;padding:14px;border:1px solid #e5e5e5;border-radius:18px;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <p style="font-weight:800;margin:0;">Fit Preview</p>
        <span style="font-size:12px;background:#eaeaea;padding:5px 8px;border-radius:999px;color:#555;">Demo</span>
      </div>

      <div id="resultImageWrap" style="position:relative;width:100%;border-radius:16px;overflow:hidden;background:#eee;">
        <img id="resultPersonImage" style="width:100%;display:block;border-radius:16px;" />
      </div>

      <div style="margin-top:12px;padding:10px;border-radius:14px;background:white;border:1px solid #eee;">
        <button id="autoFitBtn" style="width:100%;padding:10px;border:none;border-radius:12px;background:${primaryColor};color:white;cursor:pointer;font-weight:700;margin-bottom:10px;">
          Auto Fit Again
        </button>

        <p style="margin:0 0 8px 0;font-weight:700;font-size:13px;">Fine tune</p>

        <label style="font-size:12px;color:#666;">Size</label>
        <input id="sizeSlider" type="range" min="35" max="95" value="65" style="width:100%;" />

        <label style="font-size:12px;color:#666;">Move up/down</label>
        <input id="topSlider" type="range" min="15" max="65" value="42" style="width:100%;" />

        <label style="font-size:12px;color:#666;">Move left/right</label>
        <input id="leftSlider" type="range" min="25" max="75" value="50" style="width:100%;" />

        <label style="font-size:12px;color:#666;">Transparency</label>
        <input id="opacitySlider" type="range" min="40" max="100" value="92" style="width:100%;" />
      </div>

      <button id="saveLookBtn" style="margin-top:12px;width:100%;padding:11px;border:none;border-radius:12px;background:#eee;color:#111;cursor:pointer;font-weight:700;">
        Save Look
      </button>

      <p style="font-size:12px;color:#777;margin:10px 0 0 0;">
        Demo preview — real AI generation connects here next.
      </p>
    </div>

    <p id="statusText" style="font-size:13px;color:#777;margin:12px 0 0;">Choose an item from the store.</p>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(popup);

  const selectedItemBox = popup.querySelector("#selectedItemBox");
  const selectedItemImage = popup.querySelector("#selectedItemImage");
  const selectedItemName = popup.querySelector("#selectedItemName");
  const removeItemBtn = popup.querySelector("#removeItemBtn");
  const savedBox = popup.querySelector("#savedBox");
  const savedList = popup.querySelector("#savedList");
  const fileInput = popup.querySelector("#fileInput");
  const cameraBtn = popup.querySelector("#cameraBtn");
  const video = popup.querySelector("#video");
  const captureBtn = popup.querySelector("#captureBtn");
  const timerBtn = popup.querySelector("#timerBtn");
  const countdownOverlay = popup.querySelector("#countdownOverlay");
  const canvas = popup.querySelector("#canvas");
  const generateBtn = popup.querySelector("#generateBtn");
  const resultBox = popup.querySelector("#resultBox");
  const resultImageWrap = popup.querySelector("#resultImageWrap");
  const resultPersonImage = popup.querySelector("#resultPersonImage");
  const sizeSlider = popup.querySelector("#sizeSlider");
  const topSlider = popup.querySelector("#topSlider");
  const leftSlider = popup.querySelector("#leftSlider");
  const opacitySlider = popup.querySelector("#opacitySlider");
  const autoFitBtn = popup.querySelector("#autoFitBtn");
  const saveLookBtn = popup.querySelector("#saveLookBtn");
  const statusText = popup.querySelector("#statusText");

  function openPopup() {
    popup.style.display = "block";
  }

  function closeOnlyIfEmptyAfterRemoval() {
    if (!selectedClothing && savedItems.length === 0) {
      popup.style.display = "none";
    }
  }

  function getProductFromButton(button) {
    return {
      name: button.dataset.productName || button.dataset.name || "Product",
      image: button.dataset.productImage || button.dataset.image || "",
    };
  }

  function resetStoreSaveButton(itemName) {
    document.querySelectorAll("[data-tryon-action='save'], .save-btn").forEach(function (button) {
      const productName = button.dataset.productName || button.dataset.name;
      if (productName === itemName) {
        button.innerText = "Save for Later";
      }
    });
  }

  function updateSelectedItem(item) {
    selectedClothing = item;
    selectedItemBox.style.display = "block";
    selectedItemImage.src = item.image;
    selectedItemName.innerText = item.name;
    resultBox.style.display = "none";
    statusText.innerText = `${item.name} selected. Add your photo.`;
    trackEvent("try_on_clicks", item);
    openPopup();
  }

  function applyOverlayControls() {
    if (!clothingOverlay) return;
    clothingOverlay.style.width = `${sizeSlider.value}%`;
    clothingOverlay.style.top = `${topSlider.value}%`;
    clothingOverlay.style.left = `${leftSlider.value}%`;
    clothingOverlay.style.opacity = String(opacitySlider.value / 100);
  }

  function autoFitOverlay() {
    if (!clothingOverlay || !resultPersonImage.naturalWidth || !resultPersonImage.naturalHeight) return;

    const ratio = resultPersonImage.naturalHeight / resultPersonImage.naturalWidth;

    if (ratio > 1.45) {
      sizeSlider.value = 58;
      topSlider.value = 35;
      leftSlider.value = 50;
    } else if (ratio > 1.05) {
      sizeSlider.value = 66;
      topSlider.value = 42;
      leftSlider.value = 50;
    } else {
      sizeSlider.value = 45;
      topSlider.value = 48;
      leftSlider.value = 50;
    }

    opacitySlider.value = 92;
    applyOverlayControls();
  }

  function updateSavedList() {
    launcher.innerText = `${launcherText} (${savedItems.length})`;
    savedList.innerHTML = "";

    if (savedItems.length === 0) {
      savedBox.style.display = "none";
      return;
    }

    savedBox.style.display = "block";

    savedItems.forEach(function (item, index) {
      const wrapper = document.createElement("div");
      Object.assign(wrapper.style, { position: "relative", width: "96px" });

      const itemBtn = document.createElement("button");
      Object.assign(itemBtn.style, {
        width: "96px",
        border: "1px solid #ddd",
        background: "#fff",
        borderRadius: "14px",
        padding: "8px",
        cursor: "pointer",
      });

      itemBtn.innerHTML = `
        <img src="${item.image}" style="width:72px;height:72px;object-fit:cover;border-radius:10px;background:#eee;" />
        <div style="font-size:12px;margin-top:5px;font-weight:600;">${item.name}</div>
      `;

      itemBtn.onclick = function () {
        updateSelectedItem(item);
      };

      const removeSavedBtn = document.createElement("button");
      removeSavedBtn.innerText = "×";
      Object.assign(removeSavedBtn.style, {
        position: "absolute",
        top: "-7px",
        right: "-7px",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        border: "none",
        background: "#f1f1f1",
        cursor: "pointer",
        fontSize: "14px",
        lineHeight: "22px",
        padding: "0",
        textAlign: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      });

      removeSavedBtn.onclick = function (event) {
        event.stopPropagation();

        const removedItem = savedItems[index];
        savedItems.splice(index, 1);
        resetStoreSaveButton(removedItem.name);

        if (selectedClothing && selectedClothing.name === removedItem.name) {
          selectedClothing = null;
          selectedItemBox.style.display = "none";
          resultBox.style.display = "none";
        }

        updateSavedList();
        statusText.innerText = "Saved item removed.";
        trackEvent("saved_items_removed", removedItem);
        closeOnlyIfEmptyAfterRemoval();
      };

      wrapper.appendChild(itemBtn);
      wrapper.appendChild(removeSavedBtn);
      savedList.appendChild(wrapper);
    });
  }

  function saveItem(item, sourceButton) {
    if (!item.image) {
      alert("Missing product image.");
      return;
    }

    const alreadySaved = savedItems.some(function (saved) {
      return saved.name === item.name;
    });

    if (!alreadySaved) {
      savedItems.push(item);
      updateSavedList();
      if (sourceButton) sourceButton.innerText = "Saved ✓";
      trackEvent("save_for_later_clicks", item);
    }
  }

  removeItemBtn.onclick = function () {
    const removed = selectedClothing;
    selectedClothing = null;
    selectedItemBox.style.display = "none";
    resultBox.style.display = "none";
    statusText.innerText = "Item removed.";
    trackEvent("selected_items_removed", removed || {});
    closeOnlyIfEmptyAfterRemoval();
  };

  launcher.onclick = function () {
    popup.style.display = popup.style.display === "none" ? "block" : "none";
    updateSavedList();

    if (popup.style.display === "block") {
      trackEvent("closet_opens");
    }
  };

  document.addEventListener("click", function (event) {
    const button = event.target.closest("[data-tryon-action], .try-btn, .save-btn");
    if (!button) return;

    const item = getProductFromButton(button);

    if (!item.image) {
      alert("This product is missing a data-product-image.");
      return;
    }

    const action = button.dataset.tryonAction;

    if (action === "save" || button.classList.contains("save-btn")) {
      saveItem(item, button);
      return;
    }

    updateSelectedItem(item);
  });

  fileInput.onchange = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      selectedImage = reader.result;
      resultBox.style.display = "none";
      statusText.innerText = "Photo selected. Ready to generate.";
      trackEvent("photo_uploads");
    };

    reader.readAsDataURL(file);
  };

  cameraBtn.onclick = async function () {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;
    video.style.display = "block";
    captureBtn.style.display = "block";
    timerBtn.style.display = "block";
    statusText.innerText = "Camera ready. Take a photo.";
    trackEvent("camera_opens");
  };

  captureBtn.onclick = function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    selectedImage = canvas.toDataURL("image/png");
    resultBox.style.display = "none";
    statusText.innerText = "Photo captured. Ready to generate.";
    trackEvent("photos_taken");
  };

  timerBtn.onclick = function () {
    let count = 3;

    countdownOverlay.innerText = count;
    countdownOverlay.style.display = "flex";
    statusText.innerText = `Taking photo in ${count}...`;

    const countdown = setInterval(function () {
      count--;

      if (count > 0) {
        countdownOverlay.innerText = count;
        statusText.innerText = `Taking photo in ${count}...`;
      } else {
        clearInterval(countdown);
        countdownOverlay.style.display = "none";
        captureBtn.click();
      }
    }, 1000);
  };

  generateBtn.onclick = function () {
    if (!selectedClothing) {
      alert("Please choose a clothing item first.");
      return;
    }

    if (!selectedImage) {
      alert("Please upload or take a photo first.");
      return;
    }

    generateBtn.innerText = "Generating...";
    generateBtn.disabled = true;
    statusText.innerText = `Creating preview with ${selectedClothing.name}...`;

    setTimeout(function () {
      resultPersonImage.src = selectedImage;
      resultBox.style.display = "block";

      if (!clothingOverlay) {
        clothingOverlay = document.createElement("img");
        clothingOverlay.id = "clothingOverlay";
        Object.assign(clothingOverlay.style, {
          position: "absolute",
          left: "50%",
          transform: "translate(-50%, -50%) skewX(-3deg)",
          pointerEvents: "none",
          zIndex: "5",
          mixBlendMode: "multiply",
          filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.30))",
        });

        resultImageWrap.appendChild(clothingOverlay);
      }

      clothingOverlay.src = selectedClothing.image;

      resultPersonImage.onload = function () {
        autoFitOverlay();
      };

      if (resultPersonImage.complete) {
        autoFitOverlay();
      }

      statusText.innerText = "Preview ready. Adjust if needed.";
      generateBtn.innerText = "Generate Try-On Preview";
      generateBtn.disabled = false;
      trackEvent("previews_generated", selectedClothing);
    }, 1000);
  };

  autoFitBtn.onclick = autoFitOverlay;
  sizeSlider.oninput = applyOverlayControls;
  topSlider.oninput = applyOverlayControls;
  leftSlider.oninput = applyOverlayControls;
  opacitySlider.oninput = applyOverlayControls;

  saveLookBtn.onclick = function () {
    statusText.innerText = "Look saved for later.";
    trackEvent("looks_saved", selectedClothing || {});
  };
})();