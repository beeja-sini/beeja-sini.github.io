/* =====================================================================
   ALL PORTFOLIO CONTENT LIVES HERE.
   Edit this one file and the game, the classic view and the chatbot
   all update together.
   ===================================================================== */
window.PORTFOLIO = {
  name: "Beejasini Futtinga",
  firstName: "Beejasini",
  title: "Software Developer",
  tagline: "PHP, API integration, SQL Server and MySQL",
  location: "Mauritius",
  yearsExperience: "3+",
  email: "beejafuttinga@gmail.com",
  linkedin: "https://www.linkedin.com/in/beejasini-futtinga-1a78b0279",
  github: "https://github.com/beejasini", // add your profile, e.g. "https://github.com/your-username"
  resume: "assets/Beejasini-Futtinga-CV.pdf", // put your CV PDF at this path (version WITHOUT your phone number)
  lookingFor: "Open to software developer, software engineering and backend developer roles.",
  spokenLanguages: ["English", "French", "Mauritian Creole", "Hindi"],
  interests: ["Artificial intelligence", "Robotics", "Anime", "K-dramas", "Reading", "Music"],

  /* Visitor stats with GoatCounter (free). Paste your code's URL here, e.g.
     "https://beejasini.goatcounter.com/count". Leave empty to turn analytics off. */
  analytics: { goatcounter: "" },

  summary: [
    "I'm a software developer with 3+ years of professional experience building and supporting enterprise and business-critical applications.",
    "I work hands-on with PHP, JavaScript, SQL Server, MySQL, REST/SOAP APIs, JSON/XML, automation and production troubleshooting. My day-to-day covers billing and payment systems, e-invoicing and fiscalisation, cashback platforms, internal dashboards, data reconciliation and scheduled background processes.",
    "I like hard bugs. I debug methodically across the application, database, API and server layers until the real cause turns up."
  ],

  skillGroups: [
    { group: "Languages", items: ["PHP", "JavaScript", "HTML/CSS", "SQL"] },
    { group: "Frameworks and libraries", items: ["jQuery", "AJAX", "Node.js"] },
    { group: "Databases", items: ["Microsoft SQL Server", "MySQL", "SQLite", "Firebase Firestore"] },
    { group: "APIs and tools", items: ["REST", "SOAP", "JSON", "XML", "cURL", "Git", "Composer", "PHPMailer", "wkhtmltopdf", "Dompdf", "pdftk", "SSH", "WinSCP", "PuTTY"] }
  ],

  /* One gem per key skill, collected in the game. */
  gems: [
    { name: "PHP", color: "#9b8cff", note: "My core language for enterprise apps and integrations" },
    { name: "JavaScript", color: "#f5cf4a", note: "Interactive front-ends with jQuery and AJAX" },
    { name: "SQL Server", color: "#f06b6b", note: "Complex queries for transactions, reporting and reconciliation" },
    { name: "MySQL", color: "#46b4e8", note: "Powers the Recharge Cashback Platform" },
    { name: "REST & SOAP", color: "#3fd2ad", note: "Billing, payment and e-invoicing integrations" },
    { name: "HTML/CSS", color: "#ff9a4d", note: "Clean, responsive interfaces" },
    { name: "Node.js", color: "#8fd46b", note: "Server-side JavaScript" },
    { name: "Git", color: "#e58ac6", note: "Version control and team collaboration" }
  ],

  experience: [
    {
      role: "Software Developer", company: "Emtel", dates: "Nov 2024 – Present", place: "Mauritius",
      points: [
        "Develop and maintain PHP enterprise applications and internal business systems across development, UAT and production.",
        "Build and maintain API integrations for billing, payments, e-invoicing and other business processes using REST/SOAP, JSON and XML.",
        "Write complex SQL Server and MySQL queries for transaction processing, reporting, reconciliation and business-rule validation.",
        "Automate scheduled processes with Windows Task Scheduler and cron for data processing, notifications, reporting and operational workflows.",
        "Investigate and resolve application, database, API connectivity, server and production issues through structured debugging, logging and data analysis.",
        "Contribute to lease management, e-invoicing/fiscalisation, payment/billing and recharge cashback solutions."
      ]
    },
    {
      role: "Associate Software Developer", company: "Emtel", dates: "Aug 2024 – Oct 2024", place: "Mauritius",
      points: [
        "Supported development and maintenance of enterprise web applications using PHP, JavaScript and SQL.",
        "Worked on API integrations, database processing, troubleshooting and UAT."
      ]
    },
    {
      role: "Trainee Software Developer", company: "Emtel", dates: "Jul 2023 – Aug 2024", place: "Mauritius",
      points: [
        "Developed and maintained web application features using PHP and JavaScript with database-backed business logic.",
        "Gained hands-on experience in API integration, SQL, debugging, testing and enterprise application support."
      ]
    }
  ],

  internships: [
    {
      role: "Development Intern", company: "Rogers Capital", dates: "Jun 2023", place: "Mauritius, hybrid",
      points: ["Python programming and software design and prototyping in Figma."]
    },
    {
      role: "Development Intern", company: "Ceridian", dates: "Jun 2022 – Sep 2022", place: "Mauritius, hybrid",
      points: ["ASP.NET, Agile methodologies, Scrum and software development practices."]
    }
  ],

  education: [
    {
      degree: "MSc Software Project Management",
      school: "University of Mauritius",
      dates: "Aug 2026 – Present", place: "Mauritius",
      note: "Currently studying.",
      current: true
    },
    {
      degree: "BSc (Hons) Software Engineering",
      school: "Université des Mascareignes / Université de Limoges",
      dates: "Aug 2020 – Dec 2023", place: "Mauritius / France",
      note: "Dual-institution academic pathway in software engineering."
    }
  ],

  /* One ancient scroll per project. Add `image: "assets/your-screenshot.png"`
     and `links: [{ label: "Live demo", url: "..." }]` when you have them. */
  projects: [
    {
      name: "E-Invoicing & Fiscalisation", icon: "🧾", hue: 38,
      summary: "API-driven invoice processing, billing workflows, data validation and integration with fiscalisation (MRA) processes.",
      tags: ["API integration", "Billing", "Data validation", "MRA fiscalisation"],
      internal: true, links: []
    },
    {
      name: "Recharge Cashback Platform", icon: "💸", hue: 160,
      summary: "A PHP/MySQL platform for recharge eligibility, cashback tracking, automated processing and SMS notifications, supported through UAT and production.",
      tags: ["PHP", "MySQL", "SMS notifications", "Automation"],
      internal: true, links: []
    },
    {
      name: "SRM Free Internet Project", icon: "📶", hue: 200,
      summary: "An automated API-to-database workflow for record matching, deduplication and registration/termination rules, with CSV reporting, scheduled email notifications and airbox activation after an eligibility check.",
      tags: ["API to database", "Deduplication", "CSV reporting", "Scheduled emails"],
      internal: true, links: []
    },
    {
      name: "Lease Management & Landlord Systems", icon: "🏢", hue: 280,
      summary: "Internal web applications supporting lease processes, landlord information, settlements, reporting and database-driven workflows.",
      tags: ["Internal web apps", "Settlements", "Reporting", "Workflows"],
      internal: true, links: []
    },
    {
      name: "Dose 360", icon: "⚙️", hue: 10,
      summary: "An academic PHP application where I built backend features, database-driven pages and business logic.",
      tags: ["PHP", "Backend", "Database-driven", "Business logic"],
      internal: false, academic: true, links: []
    }
  ],

  additional: [
    "Linux and Windows environments", "ODBC / SQL Server connectivity", "SSL/TLS and API connectivity troubleshooting",
    "Automated email and SMS notifications", "CSV/PDF generation", "UAT and production support", "Agile / Scrum"
  ],

  strengths: [
    "Problem solving", "Analytical thinking", "Debugging", "Data accuracy", "Business-rule implementation",
    "System integration", "Adaptability", "Team collaboration", "Independent technical investigation"
  ]
,

  /* Blog posts, newest first. Each paragraph is one string in `body`. */
  blog: [
    {
      slug: "my-developer-journey",
      title: "My Developer Journey",
      date: "October 2026",
      excerpt: "Welcome to my little corner of the internet! A bit about who I am, what I'm learning and what this blog will be about.",
      body: [
        "Welcome to my little corner of the internet! 👋",
        "I'm Beejasini, a software developer passionate about building practical solutions, exploring new technologies, and continuously growing as a developer.",
        "Through my work and personal projects, I've been learning more about backend development, databases, API integrations, and software engineering. I'm also interested in exploring artificial intelligence and robotics, and discovering how emerging technologies can solve real-world problems.",
        "Beyond coding, I enjoy Anime, K-dramas, reading, and music — little things that keep me inspired and curious.",
        "This blog is where I'll share my learning experiences, technical discoveries, project updates, and lessons along the way. I'm still learning, still building, and excited to see where the journey takes me.",
        "Thanks for stopping by! 💻✨"
      ]
    }
  ]
};
