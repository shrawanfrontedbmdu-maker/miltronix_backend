import Settings from "../models/setting.model.js"


const RESERVED_SLUGS = ["login", "signup", "admin", "api", "settings", "dashboard"];
const isValidSlug = (slug) => /^[a-z0-9-]+$/.test(slug);

export const createSettings = async (req, res) => {
  try {
    const existing = await Settings.findOne();
    if (existing) {
      return res.status(400).json({ message: "Settings already exist" });
    }

    const {
      general = {},
      store = {},
      security = {},
      notifications = {},
      payment = {},
      routes = {}
    } = req.body;

    const slugValues = Object.values(routes);

    for (let slug of slugValues) {
      if (!isValidSlug(slug)) {
        return res.status(400).json({ message: `Invalid slug format: ${slug}` });
      }
      if (RESERVED_SLUGS.includes(slug)) {
        return res.status(400).json({ message: `Slug not allowed: ${slug}` });
      }
    }

    const uniqueSlugs = new Set(slugValues);
    if (uniqueSlugs.size !== slugValues.length) {
      return res.status(400).json({ message: "Duplicate slugs are not allowed" });
    }

    const settings = new Settings({
      general: {
        metaTitle: general.metaTitle || "",
        metaKeyword: general.metaKeyword || "",
        storeTheme: general.storeTheme || "Default",
        layout: general.layout || "Default",
        description: general.description || ""
      },
      store: {
        storeName: store.storeName || "",
        storeOwnerName: store.storeOwnerName || "",
        storePhone: store.storePhone || "",
        storeEmail: store.storeEmail || "",
        storeAddress: store.storeAddress || "",
        storeCity: store.storeCity || "",
        storeState: store.storeState || "",
        storeCountry: store.storeCountry || "",
        storeZip: store.storeZip || ""
      },
      security: {
        twoFactorAuth: Boolean(security.twoFactorAuth),
        loginNotifications: Boolean(security.loginNotifications),
        sessionTimeout: security.sessionTimeout || "30",
        passwordExpiry: security.passwordExpiry || "90"
      },
      notifications: {
        emailNotifications: Boolean(notifications.emailNotifications),
        orderNotifications: Boolean(notifications.orderNotifications),
        marketingEmails: Boolean(notifications.marketingEmails),
        systemUpdates: Boolean(notifications.systemUpdates)
      },
      payment: {
        currency: payment.currency || "USD",
        taxRate: payment.taxRate || "0",
        enablePaypal: Boolean(payment.enablePaypal),
        enableStripe: Boolean(payment.enableStripe),
        enableCod: Boolean(payment.enableCod)
      },
      routes: {
        product: routes.product || "products",
        category: routes.category || "categories",
        brand: routes.brand || "brands",
        order: routes.order || "orders",
        invoice: routes.invoice || "invoices",
        notification: routes.notification || "notifications",
        profile: routes.profile || "profile",
        serviceRequest: routes.serviceRequest || "service-requests",
        blog: routes.blog || "blogs",
        banner: routes.banner || "banners",
        role: routes.role || "roles"
      }
    });

    await settings.save();

    res.status(201).json({
      message: "Settings created successfully",
      settings
    });

  } catch (error) {
    console.error("Create Settings Error:", error);
    res.status(500).json({ message: "Error creating settings", error: error.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error("Get Settings Error:", error);
    res.status(500).json({ message: "Error fetching settings", error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();

    const { general, store, security, notifications, payment, routes } = req.body;

    if (general) {
      if (general.metaTitle !== undefined) settings.general.metaTitle = general.metaTitle;
      if (general.metaKeyword !== undefined) settings.general.metaKeyword = general.metaKeyword;
      if (general.storeTheme !== undefined) settings.general.storeTheme = general.storeTheme;
      if (general.layout !== undefined) settings.general.layout = general.layout;
      if (general.description !== undefined) settings.general.description = general.description;
    }

    if (store) {
      if (store.storeName !== undefined) settings.store.storeName = store.storeName;
      if (store.storeOwnerName !== undefined) settings.store.storeOwnerName = store.storeOwnerName;
      if (store.storePhone !== undefined) settings.store.storePhone = store.storePhone;
      if (store.storeEmail !== undefined) settings.store.storeEmail = store.storeEmail;
      if (store.storeAddress !== undefined) settings.store.storeAddress = store.storeAddress;
      if (store.storeCity !== undefined) settings.store.storeCity = store.storeCity;
      if (store.storeState !== undefined) settings.store.storeState = store.storeState;
      if (store.storeCountry !== undefined) settings.store.storeCountry = store.storeCountry;
      if (store.storeZip !== undefined) settings.store.storeZip = store.storeZip;
    }

    if (security) {
      if (security.twoFactorAuth !== undefined) settings.security.twoFactorAuth = Boolean(security.twoFactorAuth);
      if (security.loginNotifications !== undefined) settings.security.loginNotifications = Boolean(security.loginNotifications);
      if (security.sessionTimeout !== undefined) settings.security.sessionTimeout = security.sessionTimeout;
      if (security.passwordExpiry !== undefined) settings.security.passwordExpiry = security.passwordExpiry;
    }

    if (notifications) {
      if (notifications.emailNotifications !== undefined) settings.notifications.emailNotifications = Boolean(notifications.emailNotifications);
      if (notifications.orderNotifications !== undefined) settings.notifications.orderNotifications = Boolean(notifications.orderNotifications);
      if (notifications.marketingEmails !== undefined) settings.notifications.marketingEmails = Boolean(notifications.marketingEmails);
      if (notifications.systemUpdates !== undefined) settings.notifications.systemUpdates = Boolean(notifications.systemUpdates);
    }

    if (payment) {
      if (payment.currency !== undefined) settings.payment.currency = payment.currency;
      if (payment.taxRate !== undefined) settings.payment.taxRate = payment.taxRate;
      if (payment.enablePaypal !== undefined) settings.payment.enablePaypal = Boolean(payment.enablePaypal);
      if (payment.enableStripe !== undefined) settings.payment.enableStripe = Boolean(payment.enableStripe);
      if (payment.enableCod !== undefined) settings.payment.enableCod = Boolean(payment.enableCod);
    }

    if (routes) {
      const slugValues = Object.values(routes);

      for (let slug of slugValues) {
        if (!isValidSlug(slug)) {
          return res.status(400).json({ message: `Invalid slug format: ${slug}` });
        }
        if (RESERVED_SLUGS.includes(slug)) {
          return res.status(400).json({ message: `Slug not allowed: ${slug}` });
        }
      }

      const uniqueSlugs = new Set(slugValues);
      if (uniqueSlugs.size !== slugValues.length) {
        return res.status(400).json({ message: "Duplicate slugs are not allowed" });
      }

      for (let key in routes) {
        if (routes[key] !== undefined) {
          settings.routes[key] = routes[key];
        }
      }
    }

    await settings.save();

    res.status(200).json({
      message: "Settings updated successfully",
      settings
    });

  } catch (error) {
    console.error("Update Settings Error:", error);
    res.status(500).json({ message: "Error updating settings", error: error.message });
  }
};

export const updateRouteSlug = async (req, res) => {
  try {
    const { key, newSlug } = req.body;

    if (!key || !newSlug) {
      return res.status(400).json({ message: "Key and newSlug are required" });
    }

    const formattedSlug = newSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-");

    const settings = await Setting.findOne();

    if (!settings.routes[key]) {
      return res.status(404).json({ message: "Route key not found" });
    }

    const oldSlug = settings.routes[key];

    settings.oldRouteSlugs = settings.oldRouteSlugs || {};
    settings.oldRouteSlugs[key] = settings.oldRouteSlugs[key] || [];
    settings.oldRouteSlugs[key].push(oldSlug);

    settings.routes[key] = formattedSlug;

    await settings.save();

    res.json({ message: "Slug updated", key, oldSlug, newSlug: formattedSlug });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

