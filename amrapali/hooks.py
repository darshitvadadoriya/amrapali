app_name = "amrapali"
app_title = "amrapali"
app_publisher = "Sanskar Technolab"
app_description = "This app for the Amrapali Purchae,sales and accounting customization"
app_email = "darshit@sanskartechnolab.com"
app_license = "mit"

# Apps
# ------------------

# required_apps = []

# Each item in the list will be shown as an app in the apps page
# add_to_apps_screen = [
# 	{
# 		"name": "amrapali",
# 		"logo": "/assets/amrapali/logo.png",
# 		"title": "amrapali",
# 		"route": "/amrapali",
# 		"has_permission": "amrapali.api.permission.has_app_permission"
# 	}
# ]

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/amrapali/css/amrapali.css"
# app_include_js = "/assets/amrapali/js/amrapali.js"

# include js, css files in header of web template
# web_include_css = "/assets/amrapali/css/amrapali.css"
# web_include_js = "/assets/amrapali/js/amrapali.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "amrapali/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
doctype_js = {"Sales Invoice" : "public/js/sales_invoice.js",
              "Purchase Order" : "public/js/purchase_order.js",
              "Purchase Invoice" : "public/js/purchase_invoice.js",
              'Customer' : "public/js/customer.js",
              'Proprietor Person' : 'public/js/proprietor_person.js',
              'Vaulting Agent':'public/js/vaulting_agent.js',
              'Sales Order': 'public/js/sales_order.js',
              'Sales Order Item': 'public/js/sales_order.js'
              }
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
doctype_list_js = {"Sales Invoice" : "public/js/sales_invoice_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Svg Icons
# ------------------
# include app icons in desk
# app_include_icons = "amrapali/public/icons.svg"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "amrapali.utils.jinja_methods",
# 	"filters": "amrapali.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "amrapali.install.before_install"
# after_install = "amrapali.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "amrapali.uninstall.before_uninstall"
# after_uninstall = "amrapali.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To set up dependencies/integrations with other apps
# Name of the app being installed is passed as an argument

# before_app_install = "amrapali.utils.before_app_install"
# after_app_install = "amrapali.utils.after_app_install"

# Integration Cleanup
# -------------------
# To clean up dependencies/integrations with other apps
# Name of the app being uninstalled is passed as an argument

# before_app_uninstall = "amrapali.utils.before_app_uninstall"
# after_app_uninstall = "amrapali.utils.after_app_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "amrapali.notifications.get_notification_config"

# Permissions
# -----------
# Permissions evaluated in scripted ways

# permission_query_conditions = {
# 	"Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
# 	"Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }
doc_events = {
	"Sales Invoice": {
		"on_cancel": "amrapali.amrapali.override.sales_invoice.on_cancel",
	},
    "Purchase Order": {
		"before_save": "amrapali.amrapali.override.api.purchase_order.before_save",
	}
}

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"amrapali.tasks.all"
# 	],
# 	"daily": [
# 		"amrapali.tasks.daily"
# 	],
# 	"hourly": [
# 		"amrapali.tasks.hourly"
# 	],
# 	"weekly": [
# 		"amrapali.tasks.weekly"
# 	],
# 	"monthly": [
# 		"amrapali.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "amrapali.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "amrapali.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Task": "amrapali.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["amrapali.utils.before_request"]
# after_request = ["amrapali.utils.after_request"]

# Job Events
# ----------
# before_job = ["amrapali.utils.before_job"]
# after_job = ["amrapali.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_by}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_by}",
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_3}",
# 		"strict": False,
# 	},
# 	{
# 		"doctype": "{doctype_4}"
# 	}
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
# 	"amrapali.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_doctypes = {
# 	"Logging DocType Name": 30  # days to retain logs
# }

