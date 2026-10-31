#!/usr/bin/env bash
# Instalação em servidor Ubuntu 24.04 novo, após aprovação da contratação.
set -euo pipefail
if [[ ${EUID} -ne 0 ]]; then printf '%s\n' 'Execute como root ou com sudo no servidor.' >&2; exit 1; fi
if [[ $# -ne 1 || ! $1 =~ ^([a-zA-Z0-9][a-zA-Z0-9-]*\.)+[a-zA-Z]{2,}$ ]]; then
  printf '%s\n' 'Uso: sudo bash install-server.sh whatsapp.seu-dominio.com.br' >&2; exit 1
fi
source /etc/os-release
if [[ ${ID} != ubuntu || ${VERSION_ID} != 24.04 ]]; then printf '%s\n' 'Este instalador exige Ubuntu 24.04.' >&2; exit 1; fi
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
for file in compose.yaml Caddyfile; do
  [[ -f ${script_dir}/${file} ]] || { printf 'Arquivo ausente: %s\n' "${file}" >&2; exit 1; }
done
# Instala Docker pelo repositório oficial, sem executar scripts remotos.
if ! command -v docker >/dev/null 2>&1; then
  apt-get update
  apt-get install -y ca-certificates curl openssl
  install -m 0755 -d /etc/apt/keyrings
  curl --fail --silent --show-error --location https://download.docker.com/linux/ubuntu/gpg --output /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  architecture=$(dpkg --print-architecture)
  printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' "${architecture}" "${VERSION_CODENAME}" > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi
command -v openssl >/dev/null 2>&1 || apt-get install -y openssl
systemctl enable --now docker
docker compose version >/dev/null
install_dir=/opt/lev-whatsapp
install -m 0700 -d "${install_dir}"
if [[ ${script_dir} != "${install_dir}" ]]; then
  install -m 0600 "${script_dir}/compose.yaml" "${install_dir}/compose.yaml"
  install -m 0600 "${script_dir}/Caddyfile" "${install_dir}/Caddyfile"
fi
# Preservar as credenciais existentes em qualquer reexecução.
if [[ ! -e ${install_dir}/.env ]]; then
  umask 077
  api_key=$(openssl rand -hex 32)
  database_password=$(openssl rand -hex 32)
  {
    printf 'EVOLUTION_DOMAIN=%s\n' "$1"
    printf '%s\n' 'EVOLUTION_IMAGE=evoapicloud/evolution-api@sha256:1bd8afc4a6cf48822e6cf02469aeae7bd35a12a6b616eacd1291926307f4d339'
    printf 'EVOLUTION_API_KEY=%s\n' "${api_key}"
    printf 'POSTGRES_PASSWORD=%s\n' "${database_password}"
  } > "${install_dir}/.env"
  unset api_key database_password
fi
cd "${install_dir}"
docker compose --env-file .env config --quiet
docker compose --env-file .env pull
docker compose --env-file .env up -d
docker compose --env-file .env ps
printf '%s\n' 'Serviços iniciados. Validar DNS, HTTPS e saúde antes de conectar os números.'
printf '%s\n' 'Credenciais preservadas em /opt/lev-whatsapp/.env (somente root). Não cole esse arquivo em chats.'
