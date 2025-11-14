# Backend Connection Issues - Troubleshooting Guide

## Current Status
- ✅ Backend is running on port 8081
- ❌ Frontend cannot connect to backend
- Error: "Network error. Please check your connection and ensure the backend server is running on port 8081"

## Most Likely Causes & Solutions

### 1. CORS Configuration Missing in Spring Boot Backend

Your Spring Boot backend needs to allow requests from your React frontend. Add this to your backend:

```java
@Configuration
@EnableWebSecurity
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

Or add this annotation to your controllers:
```java
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
@RestController
public class AuthController {
    // your controller methods
}
```

### 2. Check Your Backend Login Endpoint

Make sure your backend has this endpoint:
```java
@PostMapping("/api/auth/login")
public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
    // your login logic
}
```

### 3. Frontend Development Server Port

Your React app is likely running on port 3000. Make sure your backend allows requests from:
- http://localhost:3000
- http://127.0.0.1:3000

### 4. Test Backend Directly

Open a new terminal and test your backend directly:

```bash
# Test if backend is responding
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Quick Fix Steps

1. **Add CORS configuration to your Spring Boot backend**
2. **Restart your backend server**
3. **Clear browser cache and try again**
4. **Check browser developer tools Network tab for detailed error**

## Browser Developer Tools Check

1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Look for the failed request to see the exact error
5. Check if it's a CORS error, 404 error, or connection refused

## Alternative API Base URL

If the issue persists, try changing the API base URL in your frontend from:
```typescript
const API_BASE_URL = 'http://localhost:8081'
```

To:
```typescript
const API_BASE_URL = 'http://127.0.0.1:8081'
```