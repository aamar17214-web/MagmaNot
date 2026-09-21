```javascript
import "./firebase.js";

// ========================================
// عناصر الواجهة
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

const serverModal = document.getElementById("serverModal");
const addServer = document.getElementById("addServer");
const createServer = document.getElementById("createServer");
const closeModal = document.getElementById("closeModal");
const serverName = document.getElementById("serverName");
const serverImage = document.getElementById("serverImage");
const serverList = document.getElementById("serverList");
const inviteLink = document.getElementById("inviteLink");
const copyInvite = document.getElementById("copyInvite");

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

let currentUser = null;

let currentServerId = "general";

let chatInitialized = false;

let currentDMUser = null;

let dmUnsubscribe = null;


// ========================================
// ضغط الصور
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

                const canvas =
                    document.createElement("canvas");

                const maxSize = 300;

                let width = img.width;
                let height = img.height;

                if (width > height) {

                    if (width > maxSize) {
                        height =
                            height * (maxSize / width);

                        width = maxSize;
                    }

                } else {

                    if (height > maxSize) {
                        width =
                            width * (maxSize / height);

                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx =
                    canvas.getContext("2d");

                ctx.drawImage(
                    img,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        0.7
                    )
                );
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

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value.trim();

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

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value.trim();

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

    const name =
        usernameInput.value.trim();

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

    const user =
        window.auth.currentUser;

    if (!user) {

        alert(
            "لم يتم العثور على الحساب."
        );

        return;
    }

    try {

        saveProfileButton.disabled = true;

        saveProfileButton.innerText =
            "جاري الحفظ...";

        let image = "";

        if (
            avatarInput &&
            avatarInput.files &&
            avatarInput.files.length > 0
        ) {

            image =
                await compressImage(
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
                usernameLower: name.toLowerCase(),
                avatar: image,
                email: user.email,
                createdAt: Date.now()
            }
        );

        currentUsername = name;
        avatarURL = image;
        currentUser = user;

        loginSection.style.display = "none";
        appSection.style.display = "flex";

        initLiveChat();

        createFriendsUI();

    } catch (e) {

        console.error(e);

        alert(
            "حدث خطأ أثناء حفظ الحساب:\n" +
            e.message
        );

    } finally {

        saveProfileButton.disabled = false;

        saveProfileButton.innerText =
            "دخول للموقع";
    }
};


// ========================================
// تحميل بيانات المستخدم
// ========================================

async function loadUserProfile(user) {

    try {

        const userRef =
            window.doc(
                window.db,
                "users",
                user.uid
            );

        const userSnap =
            await window.getDoc(userRef);

        if (userSnap.exists()) {

            const data =
                userSnap.data();

            currentUsername =
                data.username ||
                user.email.split("@")[0];

            avatarURL =
                data.avatar || "";

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
// حالة تسجيل الدخول
// ========================================

window.onAuthStateChanged(
    window.auth,

    async (user) => {

        if (!user) {

            currentUser = null;

            loginSection.style.display = "flex";

            appSection.style.display = "none";

            authBox.style.display = "block";

            profileBox.style.display = "none";

            return;
        }

        currentUser = user;

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

        createFriendsUI();
    }
);


// ========================================
// إرسال رسالة عامة
// ========================================

async function sendMyMessage() {

    if (currentDMUser) {

        await sendDM();

        return;
    }

    const text =
        messageInput.value.trim();

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

        console.error(e);

        alert(
            "لم يتم إرسال الرسالة."
        );
    }
}


sendMessageBtn.onclick =
    sendMyMessage;


messageInput.onkeydown = (e) => {

    if (e.key === "Enter") {
        sendMyMessage();
    }
};


// ========================================
// الشات العام
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

            if (currentDMUser) return;

            messagesBox.innerHTML = "";

            snapshot.forEach(
                (messageDoc) => {

                    const data =
                        messageDoc.data();

                    if (
                        data.server !==
                        currentServerId
                    ) {
                        return;
                    }

                    renderMessage(
                        data
                    );
                }
            );

            messagesBox.scrollTop =
                messagesBox.scrollHeight;
        }
    );
}


// ========================================
// عرض رسالة
// ========================================

function renderMessage(data) {

    const message =
        document.createElement("div");

    message.className =
        "message";

    let avatarHTML = "";

    if (data.avatar) {

        avatarHTML = `
            <img
                src="${escapeAttribute(data.avatar)}"
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

        <div style="margin-top:5px;">

            ${escapeHTML(
                data.text || ""
            )}

        </div>
    `;

    messagesBox.appendChild(message);
}


// ========================================
// حماية HTML
// ========================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;
}


function escapeAttribute(text) {

    return String(text)
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// ========================================
// واجهة الأصدقاء
// ========================================

function createFriendsUI() {

    if (
        document.getElementById(
            "friendsPanel"
        )
    ) {
        return;
    }

    const panel =
        document.createElement("div");

    panel.id =
        "friendsPanel";

    panel.style.cssText = `
        position:fixed;
        top:80px;
        right:15px;
        width:300px;
        max-width:calc(100vw - 30px);
        max-height:70vh;
        overflow-y:auto;
        background:#1b1e25;
        border:1px solid #30343f;
        border-radius:14px;
        padding:15px;
        z-index:9999;
        box-shadow:0 10px 30px rgba(0,0,0,.45);
        display:none;
    `;

    panel.innerHTML = `

        <h3 style="margin-bottom:12px;">
            👥 الأصدقاء
        </h3>

        <div style="
            display:flex;
            gap:7px;
            margin-bottom:12px;
        ">

            <input
                id="friendUsernameInput"
                type="text"
                placeholder="اسم المستخدم"
                style="
                    flex:1;
                    min-width:0;
                    padding:9px;
                    border-radius:8px;
                    border:1px solid #3a3e4a;
                    background:#111318;
                    color:white;
                "
            >

            <button
                id="addFriendButton"
                style="
                    padding:9px;
                    border:0;
                    border-radius:8px;
                    background:#5865f2;
                    color:white;
                    cursor:pointer;
                "
            >
                إضافة
            </button>

        </div>

        <div id="friendsList">
            جاري التحميل...
        </div>

    `;

    document.body.appendChild(panel);

    const button =
        document.createElement("button");

    button.id =
        "friendsButton";

    button.innerHTML =
        "👥";

    button.title =
        "الأصدقاء";

    button.style.cssText = `
        position:fixed;
        top:15px;
        right:15px;
        width:45px;
        height:45px;
        border:0;
        border-radius:12px;
        background:#5865f2;
        color:white;
        font-size:20px;
        cursor:pointer;
        z-index:10000;
    `;

    document.body.appendChild(button);

    button.onclick = () => {

        panel.style.display =
            panel.style.display === "none"
                ? "block"
                : "none";

        loadFriends();
    };

    document.getElementById(
        "addFriendButton"
    ).onclick =
        addFriend;

    loadFriends();
}


// ========================================
// إضافة صديق
// ========================================

async function addFriend() {

    const input =
        document.getElementById(
            "friendUsernameInput"
        );

    const name =
        input.value.trim();

    if (!name) {

        alert(
            "اكتب اسم المستخدم أولاً."
        );

        return;
    }

    if (
        name.toLowerCase() ===
        currentUsername.toLowerCase()
    ) {

        alert(
            "لا يمكنك إضافة نفسك."
        );

        return;
    }

    try {

        const usersRef =
            window.collection(
                window.db,
                "users"
            );

        const q =
            window.query(
                usersRef,
                window.where(
                    "usernameLower",
                    "==",
                    name.toLowerCase()
                )
            );

        const result =
            await window.getDocs(q);

        if (result.empty) {

            alert(
                "لم يتم العثور على هذا المستخدم."
            );

            return;
        }

        const friendDoc =
            result.docs[0];

        const friendData =
            friendDoc.data();

        const friendUid =
            friendDoc.id;

        await window.setDoc(
            window.doc(
                window.db,
                "friends",
                currentUser.uid,
                "list",
                friendUid
            ),
            {
                uid: friendUid,
                username:
                    friendData.username || name,
                avatar:
                    friendData.avatar || "",
                addedAt: Date.now()
            }
        );

        await window.setDoc(
            window.doc(
                window.db,
                "friends",
                friendUid,
                "list",
                currentUser.uid
            ),
            {
                uid: currentUser.uid,
                username: currentUsername,
                avatar: avatarURL,
                addedAt: Date.now()
            }
        );

        input.value = "";

        alert(
            "✅ تمت إضافة الصديق!"
        );

        loadFriends();

    } catch (e) {

        console.error(e);

        alert(
            "حدث خطأ أثناء إضافة الصديق:\n" +
            e.message
        );
    }
}


// ========================================
// تحميل الأصدقاء
// ========================================

function loadFriends() {

    if (!currentUser) return;

    const list =
        document.getElementById(
            "friendsList"
        );

    if (!list) return;

    const friendsRef =
        window.collection(
            window.db,
            "friends",
            currentUser.uid,
            "list"
        );

    window.onSnapshot(
        friendsRef,

        (snapshot) => {

            list.innerHTML = "";

            if (snapshot.empty) {

                list.innerHTML = `
                    <div style="
                        padding:10px;
                        opacity:.7;
                    ">
                        لا يوجد أصدقاء بعد.
                    </div>
                `;

                return;
            }

            snapshot.forEach(
                (friendDoc) => {

                    const data =
                        friendDoc.data();

                    const item =
                        document.createElement(
                            "button"
                        );

                    item.style.cssText = `
                        width:100%;
                        display:flex;
                        align-items:center;
                        gap:10px;
                        padding:10px;
                        margin-bottom:6px;
                        border:0;
                        border-radius:9px;
                        background:#252832;
                        color:white;
                        cursor:pointer;
                        text-align:right;
                    `;

                    const avatar =
                        data.avatar
                            ? `<img src="${escapeAttribute(data.avatar)}"
                                style="
                                    width:38px;
                                    height:38px;
                                    border-radius:50%;
                                    object-fit:cover;
                                ">`
                            : `
                                <div style="
                                    width:38px;
                                    height:38px;
                                    border-radius:50%;
                                    background:#5865f2;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                ">
                                    👤
                                </div>
                            `;

                    item.innerHTML = `
                        ${avatar}
                        <span>
                            ${escapeHTML(
                                data.username ||
                                "مستخدم"
                            )}
                        </span>
                    `;

                    item.onclick = () => {

                        openDM({
                            uid: data.uid,
                            username:
                                data.username,
                            avatar:
                                data.avatar || ""
                        });

                    };

                    list.appendChild(item);
                }
            );
        }
    );
}


// ========================================
// فتح DM
// ========================================

function openDM(friend) {

    currentDMUser =
        friend;

    if (dmUnsubscribe) {

        dmUnsubscribe();

        dmUnsubscribe = null;
    }

    const title =
        document.querySelector(
            "#channelTitle span"
        );

    if (title) {

        title.innerHTML =
            "💬 " +
            escapeHTML(
                friend.username
            );
    }

    messageInput.placeholder =
        "اكتب رسالة خاصة...";

    messagesBox.innerHTML = `
        <div style="
            text-align:center;
            opacity:.7;
            padding:20px;
        ">
            المحادثة الخاصة مع
            <b>
                ${escapeHTML(
                    friend.username
                )}
            </b>
        </div>
    `;

    listenToDM(friend);
}


// ========================================
// معرف المحادثة
// ========================================

function getDMId(uid1, uid2) {

    return [uid1, uid2]
        .sort()
        .join("_");
}


// ========================================
// الاستماع للرسائل الخاصة
// ========================================

function listenToDM(friend) {

    const dmId =
        getDMId(
            currentUser.uid,
            friend.uid
        );

    const messagesRef =
        window.collection(
            window.db,
            "directMessages",
            dmId,
            "messages"
        );

    const q =
        window.query(
            messagesRef,
            window.orderBy(
                "time",
                "asc"
            )
        );

    dmUnsubscribe =
        window.onSnapshot(
            q,

            (snapshot) => {

                messagesBox.innerHTML = "";

                snapshot.forEach(
                    (messageDoc) => {

                        const data =
                            messageDoc.data();

                        const message =
                            document.createElement(
                                "div"
                            );

                        message.className =
                            "message";

                        const mine =
                            data.senderUid ===
                            currentUser.uid;

                        message.style.cssText += `
                            ${mine
                                ? "margin-right:auto;background:#5865f2;"
                                : "margin-left:auto;background:#252832;"}
                            max-width:80%;
                        `;

                        message.innerHTML = `

                            <div>

                                <b>
                                    ${escapeHTML(
                                        data.senderName ||
                                        "مستخدم"
                                    )}
                                </b>

                            </div>

                            <div style="
                                margin-top:5px;
                            ">

                                ${escapeHTML(
                                    data.text || ""
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
// إرسال DM
// ========================================

async function sendDM() {

    if (
        !currentDMUser ||
        !currentUser
    ) {
        return;
    }

    const text =
        messageInput.value.trim();

    if (!text) return;

    try {

        const dmId =
            getDMId(
                currentUser.uid,
                currentDMUser.uid
            );

        await window.addDoc(
            window.collection(
                window.db,
                "directMessages",
                dmId,
                "messages"
            ),
            {
                senderUid:
                    currentUser.uid,

                receiverUid:
                    currentDMUser.uid,

                senderName:
                    currentUsername,

                text:
                    text,

                time:
                    Date.now()
            }
        );

        messageInput.value = "";

    } catch (e) {

        console.error(e);

        alert(
            "لم يتم إرسال الرسالة الخاصة:\n" +
            e.message
        );
    }
}


// ========================================
// إعدادات الحساب
// ========================================

if (settingsButton) {

    settingsButton.onclick = () => {

        if (!settingsModal) return;

        settingsUsername.value =
            currentUsername;

        settingsModal.style.display =
            "flex";
    };
}


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

                    username:
                        name,

                    usernameLower:
                        name.toLowerCase(),

                    email:
                        user.email
                };

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
                        merge:true
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
// إنشاء السيرفر
// ========================================

if (addServer) {

    addServer.onclick = () => {

        if (!serverModal) return;

        serverModal.style.display =
            "flex";

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


function closeServerModal() {

    if (serverModal) {

        serverModal.style.display =
            "none";
    }
}


if (closeModal) {

    closeModal.onclick =
        closeServerModal;
}


if (serverModal) {

    serverModal.addEventListener(
        "click",

        (event) => {

            if (
                event.target ===
                serverModal
            ) {
                closeServerModal();
            }
        }
    );
}


if (copyInvite) {

    copyInvite.onclick =
        async () => {

            if (!inviteLink) return;

            try {

                await navigator.clipboard.writeText(
                    inviteLink.value
                );

                alert(
                    "📋 تم نسخ رابط الدعوة!"
                );

            } catch (e) {

                inviteLink.select();

                document.execCommand(
                    "copy"
                );

                alert(
                    "📋 تم نسخ رابط الدعوة!"
                );
            }
        };
}


if (createServer) {

    createServer.onclick =
        async () => {

            const name =
                serverName.value.trim();

            if (!name) {

                alert(
                    "اكتب اسم السيرفر"
                );

                return;
            }

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "serverButton";

            button.innerText =
                name
                    .charAt(0)
                    .toUpperCase();

            button.title =
                name;

            serverList.appendChild(
                button
            );

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
// Escape
// ========================================

document.addEventListener(
    "keydown",

    (event) => {

        if (
            event.key === "Escape"
        ) {

            if (
                settingsModal &&
                settingsModal.style.display !==
                "none"
            ) {
                closeSettings();
            }

            if (
                serverModal &&
                serverModal.style.display !==
                "none"
            ) {
                closeServerModal();
            }
        }
    }
);
``
