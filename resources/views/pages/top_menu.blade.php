<nav class="navbar navbar-default">
    <div class="container">
        <ul class="nav navbar-nav">
            <a class="navbar-brand" href="{{ route('index') }}">@text(title)</a>
            @foreach($top_menu as $item)
                <li @frontWidget(page, $item) class="
                @if($item->is_active)
                        active
                    @endif
                "><a @frontField(title_in_menu, input) href="{{ url($item['full_url']) }}">{{ $item['title_in_menu'] }}</a></li>
            @endforeach
            @can('view_dashboard')
                <li><a href="{{ route('dashboard') }}">Панель управления</a></li>
            @endcan
        </ul>
        @include('user_block')
        @include('search')
    </div><!-- /.container-fluid -->
</nav>