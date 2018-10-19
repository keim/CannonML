Dir.glob "./src/**/*.js" do |path|
	script = File.read path
	File.write path, script.gsub(/CML(\w+)/, "CML.\\1");
end