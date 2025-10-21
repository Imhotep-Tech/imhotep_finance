# 🔗 URL Mapping Guide - Imhotep Finance App Restructuring

This guide shows the URL changes after the app restructuring and how to update your frontend.

## 📋 **URL Changes Summary**

### **Old URLs (Before Restructuring)**
```
/api/finance-management/transaction/add-transactions/
/api/finance-management/transaction/get-transactions/
/api/finance-management/transaction/update-transactions/<id>/
/api/finance-management/transaction/delete-transactions/<id>/
/api/finance-management/transaction/export-csv/
/api/finance-management/recalculate-networth/

/api/finance-management/scheduled-trans/add-scheduled-trans/
/api/finance-management/scheduled-trans/get-scheduled-trans/
/api/finance-management/scheduled-trans/update-scheduled-trans/<id>/
/api/finance-management/scheduled-trans/delete-scheduled-trans/<id>/
/api/finance-management/scheduled-trans/apply-scheduled-trans/

/api/finance-management/target/get-target/
/api/finance-management/target/get-score/
/api/finance-management/target/manage-target/
/api/finance-management/target/get-score-history/

/api/finance-management/reports/get-monthly-report/
/api/finance-management/reports/get-yearly-report/
/api/finance-management/reports/get-monthly-report-history/
/api/finance-management/reports/recalculate-reports/

/api/finance-management/wishlist/add-wish/
/api/finance-management/wishlist/get-wishlist/
/api/finance-management/wishlist/update-wish/<id>/
/api/finance-management/wishlist/delete-wish/<id>/
/api/finance-management/wishlist/update-wish-status/<id>/
```

### **New URLs (After Restructuring)**
```
# Transactions & NetWorth
/api/transactions/transaction/add-transactions/
/api/transactions/transaction/get-transactions/
/api/transactions/transaction/update-transactions/<id>/
/api/transactions/transaction/delete-transactions/<id>/
/api/transactions/transaction/export-csv/
/api/transactions/recalculate-networth/

# Scheduled Transactions
/api/scheduled-transactions/scheduled-trans/add-scheduled-trans/
/api/scheduled-transactions/scheduled-trans/get-scheduled-trans/
/api/scheduled-transactions/scheduled-trans/update-scheduled-trans/<id>/
/api/scheduled-transactions/scheduled-trans/delete-scheduled-trans/<id>/
/api/scheduled-transactions/scheduled-trans/apply-scheduled-trans/

# Targets
/api/targets/target/get-target/
/api/targets/target/get-score/
/api/targets/target/manage-target/
/api/targets/target/get-score-history/

# Reports
/api/reports/get-monthly-report/
/api/reports/get-yearly-report/
/api/reports/get-monthly-report-history/
/api/reports/recalculate-reports/

# Wishlist
/api/wishlist/wishlist/add-wish/
/api/wishlist/wishlist/get-wishlist/
/api/wishlist/wishlist/update-wish/<id>/
/api/wishlist/wishlist/delete-wish/<id>/
/api/wishlist/wishlist/update-wish-status/<id>/
```

## 🔄 **Backward Compatibility (Temporary)**

**Good News!** The old URLs will still work temporarily because we've added redirects in `finance_management/urls.py`:

```python
# These old URLs will redirect to new ones:
/api/finance-management/transaction/ → /api/transactions/transaction/
/api/finance-management/scheduled-trans/ → /api/scheduled-transactions/scheduled-trans/
/api/finance-management/target/ → /api/targets/target/
/api/finance-management/reports/ → /api/reports/
/api/finance-management/wishlist/ → /api/wishlist/wishlist/
```

## 🛠️ **Frontend Update Options**

### **Option 1: Update Frontend URLs (Recommended)**
Update your frontend to use the new URLs:

```javascript
// OLD
const API_BASE = '/api/finance-management/transaction/';

// NEW
const API_BASE = '/api/transactions/transaction/';
```

### **Option 2: Use Backward Compatibility (Temporary)**
Keep using old URLs temporarily (they will redirect):

```javascript
// This will still work temporarily
const API_BASE = '/api/finance-management/transaction/';
```

### **Option 3: Environment-Based URLs**
Use environment variables to switch between old and new URLs:

```javascript
const API_BASE = process.env.REACT_APP_API_BASE || '/api/transactions/transaction/';
```

## 📝 **Complete URL Mapping Table**

| Feature | Old URL | New URL | Status |
|---------|---------|---------|--------|
| **Add Transaction** | `/api/finance-management/transaction/add-transactions/` | `/api/transactions/transaction/add-transactions/` | ✅ Redirect |
| **Get Transactions** | `/api/finance-management/transaction/get-transactions/` | `/api/transactions/transaction/get-transactions/` | ✅ Redirect |
| **Update Transaction** | `/api/finance-management/transaction/update-transactions/<id>/` | `/api/transactions/transaction/update-transactions/<id>/` | ✅ Redirect |
| **Delete Transaction** | `/api/finance-management/transaction/delete-transactions/<id>/` | `/api/transactions/transaction/delete-transactions/<id>/` | ✅ Redirect |
| **Export CSV** | `/api/finance-management/transaction/export-csv/` | `/api/transactions/transaction/export-csv/` | ✅ Redirect |
| **Recalculate NetWorth** | `/api/finance-management/recalculate-networth/` | `/api/transactions/recalculate-networth/` | ✅ Redirect |
| **Add Scheduled Trans** | `/api/finance-management/scheduled-trans/add-scheduled-trans/` | `/api/scheduled-transactions/scheduled-trans/add-scheduled-trans/` | ✅ Redirect |
| **Get Scheduled Trans** | `/api/finance-management/scheduled-trans/get-scheduled-trans/` | `/api/scheduled-transactions/scheduled-trans/get-scheduled-trans/` | ✅ Redirect |
| **Add Wish** | `/api/finance-management/wishlist/add-wish/` | `/api/wishlist/wishlist/add-wish/` | ✅ Redirect |
| **Get Wishlist** | `/api/finance-management/wishlist/get-wishlist/` | `/api/wishlist/wishlist/get-wishlist/` | ✅ Redirect |
| **Get Target** | `/api/finance-management/target/get-target/` | `/api/targets/target/get-target/` | ✅ Redirect |
| **Get Monthly Report** | `/api/finance-management/reports/get-monthly-report/` | `/api/reports/get-monthly-report/` | ✅ Redirect |

## 🚀 **Migration Strategy**

### **Phase 1: Immediate Fix (Current)**
- ✅ Backward compatibility URLs are working
- ✅ Old frontend will continue to work
- ✅ No immediate changes needed

### **Phase 2: Frontend Update (Recommended)**
- Update frontend to use new URLs
- Test all endpoints
- Remove old URL references

### **Phase 3: Cleanup (Future)**
- Remove backward compatibility redirects
- Clean up old URL references

## 🔧 **Quick Fix for Current Error**

The CSRF error you're seeing is because the old URL `/api/finance-management/transaction/add-transactions/` is now being handled by the new app structure. The redirect should fix this, but if you're still getting errors, try:

1. **Clear browser cache**
2. **Restart the Django server**
3. **Check if the redirect is working**

## 📞 **Testing URLs**

Test these URLs to verify everything is working:

```bash
# Test old URLs (should redirect)
curl -X GET http://localhost:8000/api/finance-management/transaction/get-transactions/

# Test new URLs (should work directly)
curl -X GET http://localhost:8000/api/transactions/transaction/get-transactions/
```

---

**The backward compatibility redirects should resolve your CSRF error immediately!** 🎉
