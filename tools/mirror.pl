#!/usr/bin/perl
# Mirror faridbettioui.framer.website into a local static site, localising
# framerusercontent.com assets and hiding the Framer badge; strips editor/analytics.
use strict; use warnings;
use File::Path qw(make_path); use File::Basename qw(dirname);

my $out  = shift or die "usage: mirror.pl OUTDIR\n";
my $site = 'https://faridbettioui.framer.website';
my @pages = qw(/ /projects /work/trigocity /work/buzzline-branding /work/s412
  /blog/color-theory-in-design /blog/sandwiches-and-lemon-juice
  /blog/my-awesome-daily-routine /blog/relaxing-sounds-of-nature
  /blog/building-portfolio-website /404);

my %seen; my @queue;
my $CDN = qr{https://framerusercontent\.com/([^"'\s)\\<>`]+)};

sub fetch { my $u = shift; my $c = `curl -sfL --max-time 60 '$u'`; return $? ? undef : $c }
sub save  { my ($p,$c)=@_; make_path(dirname($p)); open my $f,'>:raw',$p or die "$p: $!"; print $f $c; close $f }
sub enqueue {
  my $path = shift; $path =~ s/[?#].*//; $path =~ s/&amp;.*//;
  return if $path eq '' || $path =~ m{/$} || $path !~ m{\.[A-Za-z0-9]+$} || $seen{$path}++;
  push @queue, $path;
}
sub scan {
  my ($c, $base) = @_;
  enqueue($1) while $c =~ /$CDN/g;
  # CMS chunks: new URL(`./chunk.framercms`,`https://framerusercontent.com/modules/.../x.js`)
  while ($c =~ m{new URL\(`\./([^`]+)`,`https://framerusercontent\.com/([^`]*/)[^/`]*`\)}g) { enqueue("$2$1") }
  if ($base) {   # relative module imports inside .mjs files
    enqueue("$base$1") while $c =~ /["'`]\.\/([A-Za-z0-9_.\-]+\.(?:mjs|json|framercms))["'`]/g;
  }
}
sub localise {
  my $c = shift;
  # template literals can be used as a URL base, which must be absolute
  $c =~ s{`https://framerusercontent\.com/}{`\${location.origin}/_fu/}g;
  $c =~ s{https://framerusercontent\.com/}{/_fu/}g;
  $c;
}

for my $p (@pages) {
  my $html = ($p eq '/404' ? scalar `curl -sL "$site/404"` : fetch("$site$p")) or do { warn "skip page $p\n"; next };
  scan($html);
  # Badge markup stays (React hydration expects it) but is hidden with CSS
  $html =~ s{<!--[^>]*Made in Framer[^>]*-->}{}g;
  $html =~ s{<script>(?:(?!</script>).)*framer\.com/edit/init\.mjs(?:(?!</script>).)*</script>}{}s;
  $html =~ s{<script async src="https://events\.framer\.com/[^>]*></script>}{};
  $html =~ s{<link rel="canonical" href="[^"]*">}{};
  $html =~ s{</head>}{<style>#__framer-badge-container,.__framer-badge{display:none!important}</style></head>};
  $html = localise($html);
  my $file = $p eq '/' ? 'index.html' : $p eq '/404' ? '404.html' : substr($p,1).'/index.html';
  save("$out/$file", $html);
  print "page $p -> $file\n";
}

while (my $path = shift @queue) {
  my $c = fetch("https://framerusercontent.com/$path");
  unless (defined $c) { warn "missing $path\n"; next }
  if ($path =~ /\.(mjs|js|json|css)$/) {
    (my $base = $path) =~ s{[^/]+$}{};
    scan($c, $base);
    $c = localise($c);
  }
  save("$out/_fu/$path", $c);
}
print scalar(keys %seen), " assets\n";
