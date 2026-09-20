import "./firebase.js";

// ========================================
// عناصر واجهة المستخدم
// ========================================

const loginSection = document.getElementById("loginSection");
const authBox = document.getElementById("authBox");
const profileBox = document.getElementById("profileBox");
const appSection = document.getElementById("appSection");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const loginButton = document.getElementById("loginButton");
const registerButton = document.getElementById("registerButton");

const usernameInput = document.getElementById("username");
const avatarInput = document.getElementById("avatar");
const saveProfileButton = document.getElementById("saveProfileButton");

const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const messagesBox = document.getElementById("messagesBox");

// السيرفر
const serverModal = document.getElementById("serverModal");
const addServer = document.getElementById("addServer");
const createServer = document.getElementById("createServer");
const closeModal = document.getElementById("closeModal");
const serverName = document.getElementById("serverName");
const serverImage = document.getElementById("serverImage");
const serverList = document.getElementById("serverList");
const inviteLink = document.getElementById("inviteLink");
const copyInvite = document.getElementById("copyInvite");

// الإعدادات
const settingsButton = document.getElementById("settingsButton");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const saveSettingsButton = document.getElementById("saveSettingsButton");
const settingsUsername = document.getElementById("settingsUsername");
const settingsAvatar = document.getElementById("settingsAvatar");

// ========================================
// معلومات المستخدم
// ========================================

let currentUsername = "عضو مجهول";
let avatarURL = "";
let currentServerId = "general";
let chatInitialized = false;

// ========================================
// ضغط الصورة
// ========================================

function compressImage(file) {
    return new Promise((resolve, reject) => {

        if (!file) {
            resolve("");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            reject(
                new Error("الصورة يجب أن تكون أقل من 5MB.")
            );
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {

            const img = new Image();

            img.onload = () => {

                const canvas = document.createElement("canvas");

                const maxSize = 300;

                let width = img.width;
                let height = img.height;

                if (width > height) {

                    if (width > maxSize) {
                        height = height * (maxSize / width);
                        width = maxSize;
                    }

                } else {

                    if (height > maxSize) {
                        width = width * (maxSize / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                const compressed = canvas.toDataURL(
                    "image/jpeg",
                    0.7
                );

                resolve(compressed);
            };

            img.onerror = () => {
                reject(
                    new Error("تعذر قراءة الصورة.")
                );
            };

            img.src = event.target.result;
        };

        reader.onerror = () => {
            reject(
                new Error("تعذر قراءة الملف.")
            );
        };

        reader.readAsDataURL(file);
    });
}

// ========================================
// إنشاء حساب
// ========================================

registerButton.onclick = async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {

        alert(
            "يرجى كتابة البريد الإلكتروني وكلمة المرور أولاً!"
        );

        return;
    }

    if (password.length < 6) {

        alert(
            "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل!"
        );

        return;
    }

    try {

        await window.createUserWithEmailAndPassword(
            window.auth,
            email,
            password
        );

        authBox.style.display = "none";
        profileBox.style.display = "block";

    } catch (e) {

        console.error(e);

        alert(
            "خطأ في إنشاء الحساب:\n" +
            e.message
        );
    }
};

// ========================================
// تسجيل الدخول
// ========================================

loginButton.onclick = async () => {

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {

        alert(
            "يرجى كتابة البريد الإلكتروني وكلمة المرور!"
        );

        return;
    }

    try {

        await window.signInWithEmailAndPassword(
            window.auth,
            email,
            password
        );

    } catch (e) {

        console.error(e);

        alert(
            "خطأ في تسجيل الدخول:\n" +
            e.message
        );
    }
};

// ========================================
// حفظ الملف الشخصي
// ========================================

saveProfileButton.onclick = async () => {

    const name = usernameInput.value.trim();

    if (!name) {

        alert(
            "من فضلك اكتب اسم المستخدم الخاص بك!"
        );

        return;
    }

    if (name.length < 2) {

        alert(
            "اسم المستخدم يجب أن يحتوي على حرفين على الأقل!"
        );

        return;
    }

    const user = window.auth.currentUser;

    if (!user) {

        alert(
            "لم يتم العثور على الحساب. حاول تسجيل الدخول مرة أخرى."
        );

        return;
    }

    try {

        saveProfileButton.disabled = true;
        saveProfileButton.innerText = "جاري الحفظ...";

        let image = "";

        if (
            avatarInput &&
            avatarInput.files &&
            avatarInput.files.length > 0
        ) {

            image = await compressImage(
                avatarInput.files[0]
            );
        }

        await window.setDoc(
            window.doc(
                window.db,
                "users",
                user.uid
            ),
            {
                username: name,
                avatar: image,
                email: user.email,
                createdAt: Date.now()
            }
        );

        currentUsername = name;
        avatarURL = image;

        loginSection.style.display = "none";
        appSection.style.display = "flex";

        initLiveChat();

    } catch (e) {

        console.error(e);

        alert(
            "حدث خطأ أثناء حفظ الحساب:\n" +
            e.message
        );

    } finally {

        saveProfileButton.disabled = false;
        saveProfileButton.innerText = "دخول للموقع";
    }
};

// ========================================
// تحميل بيانات المستخدم
// ========================================

async function loadUserProfile(user) {

    try {

        const userRef = window.doc(
            window.db,
            "users",
            user.uid
        );

        const userSnap = await window.getDoc(
            userRef
        );

        if (userSnap.exists()) {

            const data = userSnap.data();

            currentUsername =
                data.username ||
                user.email.split("@")[0];

            avatarURL =
                data.avatar ||
                "";

            return true;
        }

    } catch (e) {

        console.error(
            "خطأ في تحميل الملف الشخصي:",
            e
        );
    }

    currentUsername =
        user.email.split("@")[0];

    avatarURL = "";

    return false;
}

// ========================================
// مراقبة حالة تسجيل الدخول
// ========================================

window.onAuthStateChanged(
    window.auth,

    async (user) => {

        if (!user) {

            loginSection.style.display = "flex";
            appSection.style.display = "none";
            authBox.style.display = "block";
            profileBox.style.display = "none";

            return;
        }

        const profileExists =
            await loadUserProfile(user);

        if (!profileExists) {

            authBox.style.display = "none";
            profileBox.style.display = "block";
            loginSection.style.display = "flex";
            appSection.style.display = "none";

            return;
        }

        loginSection.style.display = "none";
        appSection.style.display = "flex";

        initLiveChat();
    }
);

// ========================================
// إرسال رسالة
// ========================================

async function sendMyMessage() {

    const text = messageInput.value.trim();

    if (!text) return;

    try {

        await window.addDoc(
            window.collection(
                window.db,
                "chats"
            ),
            {
                user: currentUsername,
                text: text,
                avatar: avatarURL,
                server: currentServerId,
                time: Date.now()
            }
        );

        messageInput.value = "";

    } catch (e) {

        console.error(
            "خطأ في إرسال الرسالة:",
            e
        );

        alert(
            "لم يتم إرسال الرسالة."
        );
    }
}

sendMessageBtn.onclick = sendMyMessage;

messageInput.onkeydown = (e) => {

    if (e.key === "Enter") {
        sendMyMessage();
    }
};

// ========================================
// تحميل الرسائل
// ========================================

function initLiveChat() {

    if (chatInitialized) return;

    chatInitialized = true;

    const chatsRef =
        window.collection(
            window.db,
            "chats"
        );

    const q =
        window.query(
            chatsRef,
            window.orderBy(
                "time",
                "asc"
            )
        );

    window.onSnapshot(
        q,
        (snapshot) => {

            messagesBox.innerHTML = "";

            snapshot.forEach(
                (doc) => {

                    const data = doc.data();

                    if (
                        data.server !==
                        currentServerId
                    ) {
                        return;
                    }

                    const message =
                        document.createElement(
                            "div"
                        );

                    message.className = "message";

                    let avatarHTML = "";

                    if (data.avatar) {

                        avatarHTML = `
                            <img
                                src="${data.avatar}"
                                style="
                                    width:40px;
                                    height:40px;
                                    border-radius:50%;
                                    object-fit:cover;
                                    vertical-align:middle;
                                    margin-left:8px;
                                "
                            >
                        `;

                    } else {

                        avatarHTML = `
                            <div
                                style="
                                    display:inline-flex;
                                    width:40px;
                                    height:40px;
                                    border-radius:50%;
                                    background:#5865F2;
                                    color:white;
                                    align-items:center;
                                    justify-content:center;
                                    vertical-align:middle;
                                    margin-left:8px;
                                "
                            >
                                👤
                            </div>
                        `;
                    }

                    message.innerHTML = `

                        <div>

                            ${avatarHTML}

                            <b>
                                ${escapeHTML(
                                    data.user ||
                                    "عضو مجهول"
                                )}
                            </b>

                        </div>

                        <div
                            style="
                                margin-top:5px;
                            "
                        >

                            ${escapeHTML(
                                data.text ||
                                ""
                            )}

                        </div>
                    `;

                    messagesBox.appendChild(
                        message
                    );
                }
            );

            messagesBox.scrollTop =
                messagesBox.scrollHeight;
        }
    );
}

// ========================================
// حماية الرسائل
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}

// ========================================
// فتح نافذة إنشاء السيرفر
// ========================================

if (addServer) {

    addServer.onclick = () => {

        if (!serverModal) return;

        serverModal.style.display = "flex";

        const code =
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

        if (inviteLink) {

            inviteLink.value =
                window.location.origin +
                window.location.pathname +
                "?invite=" +
                code;
        }
    };
}

// ========================================
// إغلاق نافذة السيرفر
// ========================================

function closeServerModal() {

    if (serverModal) {
        serverModal.style.display = "none";
    }
}

if (closeModal) {
    closeModal.onclick = closeServerModal;
}

// الضغط خارج النافذة يغلقها
if (serverModal) {

    serverModal.addEventListener(
        "click",
        (event) => {

            if (event.target === serverModal) {
                closeServerModal();
            }
        }
    );
}

// زر Escape يغلق النافذة
document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            serverModal &&
            serverModal.style.display !== "none"
        ) {
            closeServerModal();
        }
    }
);

// ========================================
// نسخ رابط الدعوة
// ========================================

if (copyInvite) {

    copyInvite.onclick = async () => {

        if (!inviteLink) return;

        try {

            await navigator.clipboard.writeText(
                inviteLink.value
            );

            alert(
                "📋 تم نسخ رابط الدعوة الخاص بسيرفرك!"
            );

        } catch (e) {

            inviteLink.select();
            document.execCommand("copy");

            alert(
                "📋 تم نسخ رابط الدعوة!"
            );
        }
    };
}

// ========================================
// إنشاء السيرفر
// ========================================

if (createServer) {

    createServer.onclick = async () => {

        const name =
            serverName.value.trim();

        if (!name) {

            alert(
                "اكتب اسم السيرفر"
            );

            return;
        }

        const button =
            document.createElement("button");

        button.className =
            "serverButton";

        button.innerText =
            name.charAt(0).toUpperCase();

        button.title = name;

        serverList.appendChild(
            button
        );

        // إغلاق النافذة بعد الإنشاء
        closeServerModal();

        serverName.value = "";

        if (serverImage) {
            serverImage.value = "";
        }

        alert(
            "🎉 تم إنشاء السيرفر بنجاح!"
        );
    };
}

// ========================================
// الإعدادات
// ========================================

// فتح الإعدادات
if (settingsButton) {

    settingsButton.onclick = () => {

        if (!settingsModal) return;

        settingsUsername.value =
            currentUsername;

        settingsModal.style.display =
            "flex";
    };
}

// إغلاق الإعدادات
function closeSettings() {

    if (settingsModal) {
        settingsModal.style.display =
            "none";
    }
}

if (closeSettingsButton) {

    closeSettingsButton.onclick =
        closeSettings;
}

// الضغط خارج الإعدادات يغلقها
if (settingsModal) {

    settingsModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                settingsModal
            ) {
                closeSettings();
            }
        }
    );
}

// حفظ الإعدادات
if (saveSettingsButton) {

    saveSettingsButton.onclick =
        async () => {

            const name =
                settingsUsername.value.trim();

            if (!name) {

                alert(
                    "اكتب اسم المستخدم."
                );

                return;
            }

            if (name.length < 2) {

                alert(
                    "اسم المستخدم يجب أن يحتوي على حرفين على الأقل."
                );

                return;
            }

            const user =
                window.auth.currentUser;

            if (!user) {

                alert(
                    "يجب تسجيل الدخول أولاً."
                );

                return;
            }

            try {

                saveSettingsButton.disabled =
                    true;

                saveSettingsButton.innerText =
                    "جاري الحفظ...";

                const updateData = {
                    username: name,
                    email: user.email
                };

                // إذا اختار صورة جديدة
                if (
                    settingsAvatar &&
                    settingsAvatar.files &&
                    settingsAvatar.files.length > 0
                ) {

                    updateData.avatar =
                        await compressImage(
                            settingsAvatar.files[0]
                        );
                }

                await window.setDoc(
                    window.doc(
                        window.db,
                        "users",
                        user.uid
                    ),
                    updateData,
                    {
                        merge: true
                    }
                );

                currentUsername =
                    name;

                if (
                    updateData.avatar
                ) {
                    avatarURL =
                        updateData.avatar;
                }

                closeSettings();

                alert(
                    "✅ تم تحديث بيانات حسابك!"
                );

            } catch (e) {

                console.error(e);

                alert(
                    "حدث خطأ أثناء حفظ الإعدادات:\n" +
                    e.message
                );

            } finally {

                saveSettingsButton.disabled =
                    false;

                saveSettingsButton.innerText =
                    "حفظ التغييرات";
            }
        };
}

// ========================================
// Escape يغلق الإعدادات أيضًا
// ========================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            settingsModal &&
            settingsModal.style.display !== "none"
        ) {
            closeSettings();
        }
    }
);
