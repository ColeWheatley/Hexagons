"""The ONE place that says where Hexagons publishes: Cloudflare R2, bucket wheatley-cloud.

wheatley.cloud moved off AWS S3 (bucket ``wheatley.cloud``, eu-central-2) to
Cloudflare R2 on 2026-10-11. R2 speaks the S3 API, so the publish scripts still
shell out to ``aws s3 ...``; they just have to add the R2 endpoint, profile and
region to every call and must not hand AWS credentials to R2. Use:

    subprocess.run(r2_target.aws("s3", "cp", src, r2_target.s3_url(key), ...),
                   env=r2_target.aws_env(), check=True)

Override with environment variables (nothing else in the repo hard-codes these):

    WHEATLEY_BUCKET        bucket name                     (default wheatley-cloud)
    WHEATLEY_S3_ENDPOINT   S3 API endpoint                 (default: the Cloudflare account's R2 endpoint)
    WHEATLEY_AWS_PROFILE   aws CLI profile holding R2 keys (default r2; set to "" to use ambient
                           AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY, e.g. an R2 token on a build box)
    WHEATLEY_AWS_REGION    signing region                  (default auto)

The old S3 bucket is a frozen fallback and must not receive deploys.

R2 differences that matter here: no ``--website-redirect-location`` (write a
meta-refresh HTML page instead); folder URL -> index.html is a Cloudflare
rewrite rule, not a bucket feature. Content-Type, Cache-Control and
Content-Encoding metadata are stored and served as set.
"""
from __future__ import annotations

import os

BUCKET = os.environ.get("WHEATLEY_BUCKET", "wheatley-cloud")
ENDPOINT = os.environ.get(
    "WHEATLEY_S3_ENDPOINT", "https://898b8ac0de5372981a4a7de7641c4135.r2.cloudflarestorage.com")
PROFILE = os.environ.get("WHEATLEY_AWS_PROFILE", "r2")
REGION = os.environ.get("WHEATLEY_AWS_REGION", "auto")

_AWS_CREDENTIAL_ENV = ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN")


def aws(*args: str) -> list[str]:
    """``aws <args> [--profile P] --region R --endpoint-url E`` (explicit flags: old CLIs ignore endpoint_url in config)."""
    command = ["aws", *args]
    if PROFILE:
        command += ["--profile", PROFILE]
    return command + ["--region", REGION, "--endpoint-url", ENDPOINT]


def aws_env(base: dict[str, str] | None = None) -> dict[str, str]:
    """Environment for aws subprocesses: R2-safe checksums, and no stray AWS keys when a profile is used."""
    env = dict(os.environ if base is None else base)
    # Newer CLIs add CRC checksums that R2 may reject; harmless on older CLIs.
    env["AWS_REQUEST_CHECKSUM_CALCULATION"] = "when_required"
    env["AWS_RESPONSE_CHECKSUM_VALIDATION"] = "when_required"
    # The shell exports the legacy AWS S3 keys and AWS_DEFAULT_REGION; never let them reach R2.
    env["AWS_DEFAULT_REGION"] = REGION
    env["AWS_REGION"] = REGION
    if PROFILE:
        for name in _AWS_CREDENTIAL_ENV:
            env.pop(name, None)
    return env


def s3_url(key: str, bucket: str | None = None) -> str:
    return f"s3://{bucket or BUCKET}/{key.lstrip('/')}"


if __name__ == "__main__":  # `python scripts/r2_target.py` prints the effective target
    print(f"bucket={BUCKET} endpoint={ENDPOINT} profile={PROFILE or '(ambient env credentials)'} region={REGION}")
