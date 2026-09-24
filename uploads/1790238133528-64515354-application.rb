require "dotenv/load"
require "yaml"
require "sequel"

class SacctCli
  def self.settings
    @settings ||= begin
      yaml = YAML.load_file("config/settings.yml", symbolize_names: true)
      env = ENV.fetch("RACK_ENV", "development").to_sym
      yaml[:default].merge(yaml[env] || {})
    end
  end

  def self.db
    @db ||= Sequel.sqlite(settings[:db_path])
  end
end