import Foundation
import Security
import LocalAuthentication
import CryptoKit
import CoreFoundation

let tagPrefix = "com.ourself.identitymoat.founder."
let spkiP256Prefix = Data([
    0x30,0x59,0x30,0x13,0x06,0x07,0x2A,0x86,0x48,0xCE,0x3D,0x02,0x01,
    0x06,0x08,0x2A,0x86,0x48,0xCE,0x3D,0x03,0x01,0x07,0x03,0x42,0x00
])

func fail(_ message: String, _ code: Int32 = 1) -> Never {
    fputs("{\"ok\":false,\"error\":\"\(message)\"}\n", stderr)
    exit(code)
}

func jsonData(_ value: Any) throws -> Data {
    try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys, .withoutEscapingSlashes])
}

func pem(_ der: Data) -> String {
    let encoded = der.base64EncodedString()
    let lines = stride(from: 0, to: encoded.count, by: 64).map { start -> String in
        let a = encoded.index(encoded.startIndex, offsetBy: start)
        let b = encoded.index(a, offsetBy: min(64, encoded.count - start))
        return String(encoded[a..<b])
    }
    return "-----BEGIN PUBLIC KEY-----\n" + lines.joined(separator: "\n") + "\n-----END PUBLIC KEY-----\n"
}

func biometricStatus() -> [String: Any] {
    let context = LAContext()
    var error: NSError?
    let available = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    return [
        "ok": true,
        "biometry_available": available,
        "biometry_type": context.biometryType == .touchID ? "TOUCH_ID" :
            context.biometryType == .faceID ? "FACE_ID" :
            context.biometryType == .opticID ? "OPTIC_ID" : "NONE",
        "secure_enclave_key_class": "P256_SIGNING",
        "private_key_exportable": false,
        "user_presence_policy": "BIOMETRY_CURRENT_SET",
        "error": error?.localizedDescription as Any? ?? NSNull()
    ]
}

func enroll(principalId: String, outputPath: String) throws {
    guard !principalId.isEmpty else { fail("PRINCIPAL_ID_REQUIRED") }
    guard !FileManager.default.fileExists(atPath: outputPath) else { fail("IDENTITY_RECORD_ALREADY_EXISTS") }
    let context = LAContext()
    var authError: NSError?
    guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &authError) else {
        fail("BIOMETRY_UNAVAILABLE: \(authError?.localizedDescription ?? "unknown")")
    }
    var accessError: Unmanaged<CFError>?
    guard let access = SecAccessControlCreateWithFlags(
        kCFAllocatorDefault,
        kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        [.privateKeyUsage, .biometryCurrentSet],
        &accessError
    ) else {
        fail("SEC_ACCESS_CONTROL_CREATE_FAILED")
    }

    let tag = (tagPrefix + principalId).data(using: .utf8)!
    let privateAttributes: [String: Any] = [
        kSecAttrIsPermanent as String: true,
        kSecAttrApplicationTag as String: tag,
        kSecAttrAccessControl as String: access
    ]
    let attributes: [String: Any] = [
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecAttrKeySizeInBits as String: 256,
        kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
        kSecPrivateKeyAttrs as String: privateAttributes
    ]
    var keyError: Unmanaged<CFError>?
    guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &keyError) else {
        fail("SECURE_ENCLAVE_KEY_CREATE_FAILED: \(keyError?.takeRetainedValue().localizedDescription ?? "unknown")")
    }
    guard let publicKey = SecKeyCopyPublicKey(privateKey) else { fail("PUBLIC_KEY_EXPORT_FAILED") }
    var exportError: Unmanaged<CFError>?
    guard let publicBytes = SecKeyCopyExternalRepresentation(publicKey, &exportError) as Data? else {
        fail("PUBLIC_KEY_BYTES_FAILED")
    }
    guard publicBytes.count == 65, publicBytes.first == 0x04 else { fail("UNEXPECTED_P256_PUBLIC_KEY_FORMAT") }
    let spki = spkiP256Prefix + publicBytes
    let fingerprint = SHA256.hash(data: spki).map { String(format: "%02x", $0) }.joined()
    let identityId = "OURSELF-FOUNDER-" + String(fingerprint.prefix(20))
    let record: [String: Any] = [
        "schema_version": "OURSELF.IDENTITYMOAT.v0.1",
        "identity_id": identityId,
        "principal_id": principalId,
        "key_algorithm": "ECDSA_P256_SHA256",
        "public_key_spki_pem": pem(spki),
        "public_key_sha256": fingerprint,
        "authenticator": [
            "class": "MACOS_SECURE_ENCLAVE_BIOMETRY",
            "hardware_backed": true,
            "user_presence_required": true,
            "private_key_exportable": false
        ],
        "state": "ENROLLED",
        "identity_attestation": "UNVERIFIED",
        "authority": false,
        "created_at": ISO8601DateFormatter().string(from: Date())
    ]
    let data = try jsonData(record)
    do {
        try data.write(to: URL(fileURLWithPath: outputPath), options: [.atomic, .completeFileProtection])
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: outputPath)
    } catch {
        let rollbackQuery: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrApplicationTag as String: tag
        ]
        SecItemDelete(rollbackQuery as CFDictionary)
        throw error
    }
    print(String(data: data, encoding: .utf8)!)
}

func sign(principalId: String, challengePath: String) throws {
    let challengeData = try Data(contentsOf: URL(fileURLWithPath: challengePath))
    guard let challenge = try JSONSerialization.jsonObject(with: challengeData) as? [String: Any] else {
        fail("CHALLENGE_JSON_INVALID")
    }
    let canonical = try jsonData(challenge)
    let context = LAContext()
    context.localizedFallbackTitle = ""
    context.localizedReason = "Authenticate to sign the OURSELF founder identity challenge"
    let tag = (tagPrefix + principalId).data(using: .utf8)!
    let query: [String: Any] = [
        kSecClass as String: kSecClassKey,
        kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
        kSecAttrApplicationTag as String: tag,
        kSecReturnRef as String: true,
        kSecUseAuthenticationContext as String: context
    ]
    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    guard status == errSecSuccess, let privateKey = item as! SecKey? else {
        fail("FOUNDER_KEY_UNAVAILABLE_OR_AUTHENTICATION_FAILED: \(status)")
    }
    var error: Unmanaged<CFError>?
    guard let signature = SecKeyCreateSignature(
        privateKey,
        .ecdsaSignatureMessageX962SHA256,
        canonical as CFData,
        &error
    ) as Data? else {
        fail("FOUNDER_KEY_SIGNATURE_FAILED: \(error?.takeRetainedValue().localizedDescription ?? "unknown")")
    }
    let output: [String: Any] = [
        "challenge_id": challenge["challenge_id"] ?? NSNull(),
        "identity_id": challenge["identity_id"] ?? NSNull(),
        "principal_id": principalId,
        "signature_base64": signature.base64EncodedString(),
        "signed_at": ISO8601DateFormatter().string(from: Date()),
        "user_presence": "BIOMETRY_POLICY_ENFORCED"
    ]
    print(String(data: try jsonData(output), encoding: .utf8)!)
}

let args = Array(CommandLine.arguments.dropFirst())
guard let command = args.first else {
    fail("USAGE: status | enroll <principal-id> <identity-record.json> | sign <principal-id> <challenge.json>")
}
switch command {
case "status":
    print(String(data: try jsonData(biometricStatus()), encoding: .utf8)!)
case "enroll":
    guard args.count == 3 else { fail("USAGE: enroll <principal-id> <identity-record.json>") }
    try enroll(principalId: args[1], outputPath: args[2])
case "sign":
    guard args.count == 3 else { fail("USAGE: sign <principal-id> <challenge.json>") }
    try sign(principalId: args[1], challengePath: args[2])
default:
    fail("UNKNOWN_COMMAND")
}
